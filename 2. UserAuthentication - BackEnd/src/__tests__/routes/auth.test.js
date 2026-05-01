process.env.JWT_SECRET     = 'test_secret';
process.env.REFRESH_SECRET = 'test_refresh';
process.env.JWT_EXPIRES_IN = '15m';

const request  = require('supertest');
const mongoose = require('mongoose');
const app      = require('../../../server');
const User     = require('../../models/User.model');

const TEST_USER = {
  username: 'testuser',
  email:    'test@neotravel.com',
  password: 'Test@1234',
  phone:    '+1234567890',
};

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/neotravel_test');
});

afterAll(async () => {
  await User.deleteMany({ email: TEST_USER.email });
  await mongoose.connection.close();
});

afterEach(async () => {
  await User.deleteMany({ email: TEST_USER.email });
});

// ── POST /api/auth/signup ────────────────────────────────────────────────────
describe('POST /api/auth/signup', () => {
  it('creates a new user and returns tokens', async () => {
    const res = await request(app).post('/api/auth/signup').send(TEST_USER);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
    expect(res.body.data.user.email).toBe(TEST_USER.email);
  });

  it('returns 409 when email already exists', async () => {
    await request(app).post('/api/auth/signup').send(TEST_USER);
    const res = await request(app).post('/api/auth/signup').send(TEST_USER);
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/api/auth/signup').send({ email: 'x@x.com' });
    expect(res.status).toBe(400);
  });
});

// ── POST /api/auth/login ─────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/signup').send(TEST_USER);
  });

  it('returns tokens on valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: TEST_USER.email, password: TEST_USER.password,
    });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
  });

  it('returns 401 on wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: TEST_USER.email, password: 'WrongPass!1',
    });
    expect(res.status).toBe(401);
  });

  it('returns 401 on non-existent email', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@x.com', password: 'Test@1234',
    });
    expect(res.status).toBe(401);
  });

  it('returns 400 when fields are missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: TEST_USER.email });
    expect(res.status).toBe(400);
  });
});

// ── POST /api/auth/refresh ───────────────────────────────────────────────────
describe('POST /api/auth/refresh', () => {
  it('returns new tokens with valid refresh token', async () => {
    const signup = await request(app).post('/api/auth/signup').send(TEST_USER);
    const { refreshToken } = signup.body.data;

    const res = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
  });

  it('returns 401 with invalid refresh token', async () => {
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'bad.token.here' });
    expect(res.status).toBe(401);
  });

  it('returns 400 when refreshToken field is missing', async () => {
    const res = await request(app).post('/api/auth/refresh').send({});
    expect(res.status).toBe(400);
  });
});

// ── POST /api/auth/verify-email ──────────────────────────────────────────────
describe('POST /api/auth/verify-email', () => {
  it('verifies email with correct OTP', async () => {
    await request(app).post('/api/auth/signup').send(TEST_USER);
    const user = await User.findOne({ email: TEST_USER.email });
    const otp  = user.verifyToken;

    const res = await request(app).post('/api/auth/verify-email').send({
      email: TEST_USER.email, otp,
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 400 with wrong OTP', async () => {
    await request(app).post('/api/auth/signup').send(TEST_USER);
    const res = await request(app).post('/api/auth/verify-email').send({
      email: TEST_USER.email, otp: '000000',
    });
    expect(res.status).toBe(400);
  });
});

// ── POST /api/auth/forgot-password ──────────────────────────────────────────
describe('POST /api/auth/forgot-password', () => {
  it('always returns 200 (prevents email enumeration)', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({
      email: 'nonexistent@x.com',
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 400 when email is missing', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({});
    expect(res.status).toBe(400);
  });
});

// ── POST /api/auth/reset-password ───────────────────────────────────────────
describe('POST /api/auth/reset-password', () => {
  it('resets password with valid OTP', async () => {
    await request(app).post('/api/auth/signup').send(TEST_USER);
    await request(app).post('/api/auth/forgot-password').send({ email: TEST_USER.email });
    const user = await User.findOne({ email: TEST_USER.email });

    const res = await request(app).post('/api/auth/reset-password').send({
      email: TEST_USER.email, otp: user.resetToken, newPassword: 'NewPass@5678',
    });
    expect(res.status).toBe(200);
  });

  it('returns 400 with wrong OTP', async () => {
    await request(app).post('/api/auth/signup').send(TEST_USER);
    const res = await request(app).post('/api/auth/reset-password').send({
      email: TEST_USER.email, otp: '000000', newPassword: 'NewPass@5678',
    });
    expect(res.status).toBe(400);
  });
});

// ── POST /api/auth/logout ────────────────────────────────────────────────────
describe('POST /api/auth/logout', () => {
  it('logs out authenticated user', async () => {
    const signup = await request(app).post('/api/auth/signup').send(TEST_USER);
    const { accessToken } = signup.body.data;

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(401);
  });
});
