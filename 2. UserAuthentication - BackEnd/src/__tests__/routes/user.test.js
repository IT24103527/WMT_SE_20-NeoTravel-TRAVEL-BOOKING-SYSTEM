process.env.JWT_SECRET     = 'test_secret';
process.env.REFRESH_SECRET = 'test_refresh';
process.env.JWT_EXPIRES_IN = '15m';

const request  = require('supertest');
const mongoose = require('mongoose');
const app      = require('../../../server');
const User     = require('../../models/User.model');

const TEST_USER = {
  username: 'profileuser',
  email:    'profile@neotravel.com',
  password: 'Test@1234',
  phone:    '+1234567890',
};

let accessToken;
let userId;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/neotravel_test');
  await User.deleteMany({ email: TEST_USER.email });
  const res = await request(app).post('/api/auth/signup').send(TEST_USER);
  accessToken = res.body.data.accessToken;
  userId      = res.body.data.user.id;
});

afterAll(async () => {
  await User.deleteMany({ email: TEST_USER.email });
  await mongoose.connection.close();
});

const auth = () => ({ Authorization: `Bearer ${accessToken}` });

// ── GET /api/users/me ────────────────────────────────────────────────────────
describe('GET /api/users/me', () => {
  it('returns current user profile', async () => {
    const res = await request(app).get('/api/users/me').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(TEST_USER.email);
    expect(res.body.data).not.toHaveProperty('password');
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.status).toBe(401);
  });
});

// ── PATCH /api/users/update ──────────────────────────────────────────────────
describe('PATCH /api/users/update', () => {
  it('updates username and bio', async () => {
    const res = await request(app)
      .patch('/api/users/update')
      .set(auth())
      .send({ username: 'updateduser', bio: 'Travel lover' });
    expect(res.status).toBe(200);
    expect(res.body.data.username).toBe('updateduser');
    expect(res.body.data.bio).toBe('Travel lover');
  });

  it('returns 401 without token', async () => {
    const res = await request(app).patch('/api/users/update').send({ username: 'x' });
    expect(res.status).toBe(401);
  });
});

// ── PATCH /api/users/change-password ────────────────────────────────────────
describe('PATCH /api/users/change-password', () => {
  it('changes password with correct current password', async () => {
    const res = await request(app)
      .patch('/api/users/change-password')
      .set(auth())
      .send({ currentPassword: TEST_USER.password, newPassword: 'NewPass@9999' });
    expect(res.status).toBe(200);
    // restore password for subsequent tests
    await request(app)
      .patch('/api/users/change-password')
      .set(auth())
      .send({ currentPassword: 'NewPass@9999', newPassword: TEST_USER.password });
  });

  it('returns 400 with wrong current password', async () => {
    const res = await request(app)
      .patch('/api/users/change-password')
      .set(auth())
      .send({ currentPassword: 'WrongPass!1', newPassword: 'NewPass@9999' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when new password equals current', async () => {
    const res = await request(app)
      .patch('/api/users/change-password')
      .set(auth())
      .send({ currentPassword: TEST_USER.password, newPassword: TEST_USER.password });
    expect(res.status).toBe(400);
  });
});

// ── PATCH /api/users/preferences ────────────────────────────────────────────
describe('PATCH /api/users/preferences', () => {
  it('saves travel styles and currency', async () => {
    const res = await request(app)
      .patch('/api/users/preferences')
      .set(auth())
      .send({ travelStyles: ['Beach', 'Luxury'], currency: 'EUR' });
    expect(res.status).toBe(200);
    expect(res.body.data.preferences.travelStyles).toContain('Beach');
    expect(res.body.data.preferences.currency).toBe('EUR');
  });
});

// ── PATCH /api/users/privacy ─────────────────────────────────────────────────
describe('PATCH /api/users/privacy', () => {
  it('updates privacy settings', async () => {
    const res = await request(app)
      .patch('/api/users/privacy')
      .set(auth())
      .send({ showEmail: true, profileVisible: false });
    expect(res.status).toBe(200);
    expect(res.body.data.showEmail).toBe(true);
    expect(res.body.data.profileVisible).toBe(false);
  });
});

// ── GET /api/users/login-history ─────────────────────────────────────────────
describe('GET /api/users/login-history', () => {
  it('returns login history array', async () => {
    const res = await request(app).get('/api/users/login-history').set(auth());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

// ── DELETE /api/users/login-history ──────────────────────────────────────────
describe('DELETE /api/users/login-history', () => {
  it('clears login history', async () => {
    const res = await request(app).delete('/api/users/login-history').set(auth());
    expect(res.status).toBe(200);
    const check = await request(app).get('/api/users/login-history').set(auth());
    expect(check.body.data).toHaveLength(0);
  });
});

// ── GET /api/users/activity ───────────────────────────────────────────────────
describe('GET /api/users/activity', () => {
  it('returns activity log array', async () => {
    const res = await request(app).get('/api/users/activity').set(auth());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

// ── GET /api/users/sessions ───────────────────────────────────────────────────
describe('GET /api/users/sessions', () => {
  it('returns sessions array', async () => {
    const res = await request(app).get('/api/users/sessions').set(auth());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

// ── GET /api/users/export ─────────────────────────────────────────────────────
describe('GET /api/users/export', () => {
  it('returns exported account data', async () => {
    const res = await request(app).get('/api/users/export').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('profile');
    expect(res.body.data).toHaveProperty('preferences');
    expect(res.body.data).toHaveProperty('loginHistory');
    expect(res.body.data.profile.email).toBe(TEST_USER.email);
  });
});

// ── PATCH /api/users/deactivate ───────────────────────────────────────────────
describe('PATCH /api/users/deactivate', () => {
  it('deactivates the account', async () => {
    // Create a separate user to deactivate
    const tmpUser = { username: 'tmp', email: 'tmp@neotravel.com', password: 'Test@1234' };
    const signup  = await request(app).post('/api/auth/signup').send(tmpUser);
    const tmpToken = signup.body.data.accessToken;

    const res = await request(app)
      .patch('/api/users/deactivate')
      .set({ Authorization: `Bearer ${tmpToken}` });
    expect(res.status).toBe(200);

    // Deactivated user should get 403
    const me = await request(app).get('/api/users/me').set({ Authorization: `Bearer ${tmpToken}` });
    expect(me.status).toBe(403);

    await User.deleteMany({ email: tmpUser.email });
  });
});

// ── DELETE /api/users/delete ──────────────────────────────────────────────────
describe('DELETE /api/users/delete', () => {
  it('deletes the account', async () => {
    const tmpUser = { username: 'del', email: 'del@neotravel.com', password: 'Test@1234' };
    const signup  = await request(app).post('/api/auth/signup').send(tmpUser);
    const tmpToken = signup.body.data.accessToken;

    const res = await request(app)
      .delete('/api/users/delete')
      .set({ Authorization: `Bearer ${tmpToken}` });
    expect(res.status).toBe(200);

    const user = await User.findOne({ email: tmpUser.email });
    expect(user).toBeNull();
  });
});
