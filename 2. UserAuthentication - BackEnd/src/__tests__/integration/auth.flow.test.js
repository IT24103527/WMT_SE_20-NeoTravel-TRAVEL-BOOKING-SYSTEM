/**
 * Integration tests — Auth Flow
 *
 * Tests complete multi-step user journeys that span multiple endpoints,
 * verifying that state persists correctly across requests.
 */

process.env.JWT_SECRET     = 'test_secret';
process.env.REFRESH_SECRET = 'test_refresh';
process.env.JWT_EXPIRES_IN = '15m';

const request  = require('supertest');
const mongoose = require('mongoose');
const app      = require('../../../server');
const User     = require('../../models/User.model');

// ─── Shared test data ─────────────────────────────────────────────────────────
const BASE_USER = {
  username: 'flowuser',
  email:    'flow@neotravel.com',
  password: 'Test@1234',
  phone:    '+1234567890',
};

// Helper: sign up and return full response body
const signupUser = (overrides = {}) =>
  request(app).post('/api/auth/signup').send({ ...BASE_USER, ...overrides });

// Helper: log in and return full response body
const loginUser = (email = BASE_USER.email, password = BASE_USER.password) =>
  request(app).post('/api/auth/login').send({ email, password });

// Helper: auth header
const bearer = (token) => ({ Authorization: `Bearer ${token}` });

// ─── DB lifecycle ─────────────────────────────────────────────────────────────
beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/neotravel_test');
});

afterAll(async () => {
  await User.deleteMany({ email: { $regex: /neotravel\.com$/ } });
  await mongoose.connection.close();
});

afterEach(async () => {
  await User.deleteMany({ email: BASE_USER.email });
});

// ─────────────────────────────────────────────────────────────────────────────
// FLOW 1: Complete signup → verify email → login
// ─────────────────────────────────────────────────────────────────────────────
describe('Flow: signup → verify email → login', () => {
  it('signup creates unverified user, verify marks it verified, login succeeds', async () => {
    // Step 1: Signup
    const signupRes = await signupUser();
    expect(signupRes.status).toBe(201);
    expect(signupRes.body.data.user.isVerified).toBe(false);

    // Step 2: Read OTP directly from DB (simulates email delivery)
    const dbUser = await User.findOne({ email: BASE_USER.email });
    expect(dbUser.verifyToken).toBeTruthy();
    expect(dbUser.isVerified).toBe(false);

    // Step 3: Verify email
    const verifyRes = await request(app)
      .post('/api/auth/verify-email')
      .send({ email: BASE_USER.email, otp: dbUser.verifyToken });
    expect(verifyRes.status).toBe(200);

    // Step 4: Confirm DB state
    const verified = await User.findOne({ email: BASE_USER.email });
    expect(verified.isVerified).toBe(true);
    expect(verified.verifyToken).toBeNull();

    // Step 5: Login works after verification
    const loginRes = await loginUser();
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.user.isVerified).toBe(true);
  });

  it('login succeeds even before email is verified', async () => {
    await signupUser();
    const loginRes = await loginUser();
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data).toHaveProperty('accessToken');
  });

  it('verifying email twice returns 400 on second attempt', async () => {
    await signupUser();
    const dbUser = await User.findOne({ email: BASE_USER.email });

    await request(app)
      .post('/api/auth/verify-email')
      .send({ email: BASE_USER.email, otp: dbUser.verifyToken });

    // Second attempt
    const res = await request(app)
      .post('/api/auth/verify-email')
      .send({ email: BASE_USER.email, otp: dbUser.verifyToken });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already verified/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FLOW 2: Token lifecycle — access → refresh → invalidate
// ─────────────────────────────────────────────────────────────────────────────
describe('Flow: token lifecycle', () => {
  it('refresh token returns new access + refresh tokens', async () => {
    const { body: { data } } = await signupUser();
    const oldRefresh = data.refreshToken;

    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: oldRefresh });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.data.accessToken).toBeTruthy();
    expect(refreshRes.body.data.refreshToken).toBeTruthy();
    // New tokens should differ from old ones
    expect(refreshRes.body.data.refreshToken).not.toBe(oldRefresh);
  });

  it('old refresh token is invalidated after rotation', async () => {
    const { body: { data } } = await signupUser();
    const oldRefresh = data.refreshToken;

    // Rotate once
    await request(app).post('/api/auth/refresh').send({ refreshToken: oldRefresh });

    // Old token should now be rejected
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: oldRefresh });
    expect(res.status).toBe(401);
  });

  it('access token from refresh works for protected routes', async () => {
    const { body: { data } } = await signupUser();

    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: data.refreshToken });

    const newAccess = refreshRes.body.data.accessToken;
    const meRes = await request(app)
      .get('/api/users/me')
      .set(bearer(newAccess));
    expect(meRes.status).toBe(200);
    expect(meRes.body.data.email).toBe(BASE_USER.email);
  });

  it('logout clears refresh token in DB', async () => {
    const { body: { data } } = await signupUser();

    await request(app)
      .post('/api/auth/logout')
      .set(bearer(data.accessToken));

    const dbUser = await User.findOne({ email: BASE_USER.email });
    expect(dbUser.refreshToken).toBeNull();
  });

  it('refresh token is rejected after logout', async () => {
    const { body: { data } } = await signupUser();

    await request(app)
      .post('/api/auth/logout')
      .set(bearer(data.accessToken));

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: data.refreshToken });
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FLOW 3: Forgot password → reset → login with new password
// ─────────────────────────────────────────────────────────────────────────────
describe('Flow: forgot password → reset → login', () => {
  it('full password reset flow works end-to-end', async () => {
    await signupUser();

    // Step 1: Request reset
    const forgotRes = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: BASE_USER.email });
    expect(forgotRes.status).toBe(200);

    // Step 2: Read OTP from DB
    const dbUser = await User.findOne({ email: BASE_USER.email });
    expect(dbUser.resetToken).toBeTruthy();

    // Step 3: Reset password
    const resetRes = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: BASE_USER.email, otp: dbUser.resetToken, newPassword: 'NewPass@5678' });
    expect(resetRes.status).toBe(200);

    // Step 4: Old password no longer works
    const oldLoginRes = await loginUser(BASE_USER.email, BASE_USER.password);
    expect(oldLoginRes.status).toBe(401);

    // Step 5: New password works
    const newLoginRes = await loginUser(BASE_USER.email, 'NewPass@5678');
    expect(newLoginRes.status).toBe(200);
    expect(newLoginRes.body.data).toHaveProperty('accessToken');
  });

  it('reset token is cleared from DB after successful reset', async () => {
    await signupUser();
    await request(app).post('/api/auth/forgot-password').send({ email: BASE_USER.email });
    const dbUser = await User.findOne({ email: BASE_USER.email });

    await request(app).post('/api/auth/reset-password').send({
      email: BASE_USER.email, otp: dbUser.resetToken, newPassword: 'NewPass@5678',
    });

    const after = await User.findOne({ email: BASE_USER.email });
    expect(after.resetToken).toBeNull();
    expect(after.resetTokenExpiry).toBeNull();
  });

  it('reset token cannot be reused after successful reset', async () => {
    await signupUser();
    await request(app).post('/api/auth/forgot-password').send({ email: BASE_USER.email });
    const dbUser = await User.findOne({ email: BASE_USER.email });
    const otp = dbUser.resetToken;

    await request(app).post('/api/auth/reset-password').send({
      email: BASE_USER.email, otp, newPassword: 'NewPass@5678',
    });

    // Attempt to reuse the same OTP
    const res = await request(app).post('/api/auth/reset-password').send({
      email: BASE_USER.email, otp, newPassword: 'AnotherPass@9',
    });
    expect(res.status).toBe(400);
  });

  it('refresh token is invalidated after password reset', async () => {
    const { body: { data } } = await signupUser();
    const oldRefresh = data.refreshToken;

    await request(app).post('/api/auth/forgot-password').send({ email: BASE_USER.email });
    const dbUser = await User.findOne({ email: BASE_USER.email });

    await request(app).post('/api/auth/reset-password').send({
      email: BASE_USER.email, otp: dbUser.resetToken, newPassword: 'NewPass@5678',
    });

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: oldRefresh });
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FLOW 4: Resend verification
// ─────────────────────────────────────────────────────────────────────────────
describe('Flow: resend verification', () => {
  it('resend generates a new OTP and old one is replaced', async () => {
    await signupUser();
    const before = await User.findOne({ email: BASE_USER.email });
    const oldOtp = before.verifyToken;

    await request(app)
      .post('/api/auth/resend-verification')
      .send({ email: BASE_USER.email });

    const after = await User.findOne({ email: BASE_USER.email });
    expect(after.verifyToken).toBeTruthy();
    expect(after.verifyToken).not.toBe(oldOtp);
  });

  it('new OTP from resend can verify the email', async () => {
    await signupUser();

    await request(app)
      .post('/api/auth/resend-verification')
      .send({ email: BASE_USER.email });

    const dbUser = await User.findOne({ email: BASE_USER.email });
    const res = await request(app)
      .post('/api/auth/verify-email')
      .send({ email: BASE_USER.email, otp: dbUser.verifyToken });
    expect(res.status).toBe(200);
  });

  it('resend returns 400 for already-verified email', async () => {
    await signupUser();
    const dbUser = await User.findOne({ email: BASE_USER.email });

    await request(app)
      .post('/api/auth/verify-email')
      .send({ email: BASE_USER.email, otp: dbUser.verifyToken });

    const res = await request(app)
      .post('/api/auth/resend-verification')
      .send({ email: BASE_USER.email });
    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FLOW 5: Login history is recorded
// ─────────────────────────────────────────────────────────────────────────────
describe('Flow: login history recording', () => {
  it('successful login is recorded in login history', async () => {
    const { body: { data } } = await signupUser();
    await loginUser();

    const histRes = await request(app)
      .get('/api/users/login-history')
      .set(bearer(data.accessToken));

    expect(histRes.status).toBe(200);
    const history = histRes.body.data;
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].success).toBe(true);
  });

  it('failed login attempt is recorded in login history', async () => {
    const { body: { data } } = await signupUser();

    // Attempt with wrong password
    await loginUser(BASE_USER.email, 'WrongPass!1');

    const histRes = await request(app)
      .get('/api/users/login-history')
      .set(bearer(data.accessToken));

    const history = histRes.body.data;
    const failedEntry = history.find((h) => h.success === false);
    expect(failedEntry).toBeDefined();
  });

  it('login history is capped at 10 entries', async () => {
    const { body: { data } } = await signupUser();

    // Perform 12 logins
    for (let i = 0; i < 12; i++) {
      await loginUser();
    }

    const histRes = await request(app)
      .get('/api/users/login-history')
      .set(bearer(data.accessToken));

    expect(histRes.body.data.length).toBeLessThanOrEqual(10);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FLOW 6: Deactivated account is blocked
// ─────────────────────────────────────────────────────────────────────────────
describe('Flow: account deactivation', () => {
  const DEACT_USER = {
    username: 'deactuser',
    email:    'deact@neotravel.com',
    password: 'Test@1234',
  };

  afterEach(async () => {
    await User.deleteMany({ email: DEACT_USER.email });
  });

  it('deactivated account cannot log in', async () => {
    const { body: { data } } = await request(app)
      .post('/api/auth/signup').send(DEACT_USER);

    await request(app)
      .patch('/api/users/deactivate')
      .set(bearer(data.accessToken));

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: DEACT_USER.email, password: DEACT_USER.password });
    expect(loginRes.status).toBe(403);
  });

  it('deactivated account cannot access protected routes', async () => {
    const { body: { data } } = await request(app)
      .post('/api/auth/signup').send(DEACT_USER);

    await request(app)
      .patch('/api/users/deactivate')
      .set(bearer(data.accessToken));

    const meRes = await request(app)
      .get('/api/users/me')
      .set(bearer(data.accessToken));
    expect(meRes.status).toBe(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FLOW 7: Response shape consistency
// ─────────────────────────────────────────────────────────────────────────────
describe('Flow: response shape consistency', () => {
  it('every success response has success:true, statusCode, message', async () => {
    const res = await signupUser();
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('statusCode', 201);
    expect(res.body).toHaveProperty('message');
  });

  it('every error response has success:false, statusCode, message', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@x.com', password: 'Test@1234' });
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('statusCode');
    expect(res.body).toHaveProperty('message');
  });

  it('password is never returned in any auth response', async () => {
    const res = await signupUser();
    const bodyStr = JSON.stringify(res.body);
    expect(bodyStr).not.toMatch(/"password"/);
  });

  it('refreshToken field is never returned in /me response', async () => {
    const { body: { data } } = await signupUser();
    const meRes = await request(app)
      .get('/api/users/me')
      .set(bearer(data.accessToken));
    expect(meRes.body.data).not.toHaveProperty('refreshToken');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FLOW 8: Health check and 404 handling
// ─────────────────────────────────────────────────────────────────────────────
describe('Flow: server health and routing', () => {
  it('GET /health returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('unknown route returns 404 with descriptive message', async () => {
    const res = await request(app).get('/api/nonexistent-route');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('/api/nonexistent-route');
  });

  it('unknown method on known route returns 404', async () => {
    const res = await request(app).put('/api/auth/login').send({});
    expect(res.status).toBe(404);
  });
});
