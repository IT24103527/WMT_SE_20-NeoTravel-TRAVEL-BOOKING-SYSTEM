/**
 * Integration tests — User Profile Flow
 *
 * Tests complete multi-step user journeys across profile, security,
 * preferences, privacy, sessions, and data export endpoints.
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
  username: 'profileflow',
  email:    'profileflow@neotravel.com',
  password: 'Test@1234',
  phone:    '+1234567890',
};

let accessToken;
let userId;

const bearer = (token) => ({ Authorization: `Bearer ${token}` });

// ─── DB lifecycle ─────────────────────────────────────────────────────────────
beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/neotravel_test');
  await User.deleteMany({ email: BASE_USER.email });
  const res = await request(app).post('/api/auth/signup').send(BASE_USER);
  accessToken = res.body.data.accessToken;
  userId      = res.body.data.user.id;
});

afterAll(async () => {
  await User.deleteMany({ email: BASE_USER.email });
  await mongoose.connection.close();
});

// ─────────────────────────────────────────────────────────────────────────────
// FLOW 1: Profile update persists and is reflected in /me
// ─────────────────────────────────────────────────────────────────────────────
describe('Flow: profile update → /me reflects changes', () => {
  it('updated username is returned by /me', async () => {
    await request(app)
      .patch('/api/users/update')
      .set(bearer(accessToken))
      .send({ username: 'UpdatedFlowUser' });

    const meRes = await request(app)
      .get('/api/users/me')
      .set(bearer(accessToken));

    expect(meRes.body.data.username).toBe('UpdatedFlowUser');
  });

  it('updated bio is returned by /me', async () => {
    await request(app)
      .patch('/api/users/update')
      .set(bearer(accessToken))
      .send({ bio: 'I love to travel' });

    const meRes = await request(app)
      .get('/api/users/me')
      .set(bearer(accessToken));

    expect(meRes.body.data.bio).toBe('I love to travel');
  });

  it('updated phone is returned by /me', async () => {
    await request(app)
      .patch('/api/users/update')
      .set(bearer(accessToken))
      .send({ phone: '+9876543210' });

    const meRes = await request(app)
      .get('/api/users/me')
      .set(bearer(accessToken));

    expect(meRes.body.data.phone).toBe('+9876543210');
  });

  it('profile update is recorded in activity log', async () => {
    await request(app)
      .patch('/api/users/update')
      .set(bearer(accessToken))
      .send({ bio: 'Activity log test' });

    const logRes = await request(app)
      .get('/api/users/activity')
      .set(bearer(accessToken));

    const actions = logRes.body.data.map((e) => e.action);
    expect(actions).toContain('profile_updated');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FLOW 2: Change password → old token still works, old password rejected
// ─────────────────────────────────────────────────────────────────────────────
describe('Flow: change password', () => {
  const TMP_USER = {
    username: 'pwdflowuser',
    email:    'pwdflow@neotravel.com',
    password: 'Test@1234',
  };

  let tmpToken;

  beforeEach(async () => {
    await User.deleteMany({ email: TMP_USER.email });
    const res = await request(app).post('/api/auth/signup').send(TMP_USER);
    tmpToken = res.body.data.accessToken;
  });

  afterEach(async () => {
    await User.deleteMany({ email: TMP_USER.email });
  });

  it('change password succeeds with correct current password', async () => {
    const res = await request(app)
      .patch('/api/users/change-password')
      .set(bearer(tmpToken))
      .send({ currentPassword: TMP_USER.password, newPassword: 'NewPass@9999' });
    expect(res.status).toBe(200);
  });

  it('old password is rejected after change', async () => {
    await request(app)
      .patch('/api/users/change-password')
      .set(bearer(tmpToken))
      .send({ currentPassword: TMP_USER.password, newPassword: 'NewPass@9999' });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: TMP_USER.email, password: TMP_USER.password });
    expect(loginRes.status).toBe(401);
  });

  it('new password works for login after change', async () => {
    await request(app)
      .patch('/api/users/change-password')
      .set(bearer(tmpToken))
      .send({ currentPassword: TMP_USER.password, newPassword: 'NewPass@9999' });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: TMP_USER.email, password: 'NewPass@9999' });
    expect(loginRes.status).toBe(200);
  });

  it('password change is recorded in activity log', async () => {
    await request(app)
      .patch('/api/users/change-password')
      .set(bearer(tmpToken))
      .send({ currentPassword: TMP_USER.password, newPassword: 'NewPass@9999' });

    const logRes = await request(app)
      .get('/api/users/activity')
      .set(bearer(tmpToken));

    const actions = logRes.body.data.map((e) => e.action);
    expect(actions).toContain('password_changed');
  });

  it('returns 400 when new password is same as current', async () => {
    const res = await request(app)
      .patch('/api/users/change-password')
      .set(bearer(tmpToken))
      .send({ currentPassword: TMP_USER.password, newPassword: TMP_USER.password });
    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FLOW 3: Preferences persist across requests
// ─────────────────────────────────────────────────────────────────────────────
describe('Flow: preferences update → /me reflects changes', () => {
  it('travel styles are saved and returned by /me', async () => {
    await request(app)
      .patch('/api/users/preferences')
      .set(bearer(accessToken))
      .send({ travelStyles: ['Beach', 'Mountain', 'Luxury'] });

    const meRes = await request(app)
      .get('/api/users/me')
      .set(bearer(accessToken));

    expect(meRes.body.data.preferences.travelStyles).toEqual(
      expect.arrayContaining(['Beach', 'Mountain', 'Luxury'])
    );
  });

  it('currency preference is saved and returned by /me', async () => {
    await request(app)
      .patch('/api/users/preferences')
      .set(bearer(accessToken))
      .send({ currency: 'GBP' });

    const meRes = await request(app)
      .get('/api/users/me')
      .set(bearer(accessToken));

    expect(meRes.body.data.preferences.currency).toBe('GBP');
  });

  it('notification preferences are saved', async () => {
    await request(app)
      .patch('/api/users/preferences')
      .set(bearer(accessToken))
      .send({ notifications: { push: false, email: true } });

    const meRes = await request(app)
      .get('/api/users/me')
      .set(bearer(accessToken));

    expect(meRes.body.data.preferences.notifications.push).toBe(false);
    expect(meRes.body.data.preferences.notifications.email).toBe(true);
  });

  it('multiple preference fields can be updated in one request', async () => {
    await request(app)
      .patch('/api/users/preferences')
      .set(bearer(accessToken))
      .send({ currency: 'JPY', language: 'ja', biometric: true });

    const meRes = await request(app)
      .get('/api/users/me')
      .set(bearer(accessToken));

    expect(meRes.body.data.preferences.currency).toBe('JPY');
    expect(meRes.body.data.preferences.language).toBe('ja');
    expect(meRes.body.data.preferences.biometric).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FLOW 4: Privacy settings persist across requests
// ─────────────────────────────────────────────────────────────────────────────
describe('Flow: privacy settings update → /me reflects changes', () => {
  it('profileVisible:false is persisted', async () => {
    await request(app)
      .patch('/api/users/privacy')
      .set(bearer(accessToken))
      .send({ profileVisible: false });

    const meRes = await request(app)
      .get('/api/users/me')
      .set(bearer(accessToken));

    expect(meRes.body.data.privacy.profileVisible).toBe(false);
  });

  it('showEmail:true is persisted', async () => {
    await request(app)
      .patch('/api/users/privacy')
      .set(bearer(accessToken))
      .send({ showEmail: true });

    const meRes = await request(app)
      .get('/api/users/me')
      .set(bearer(accessToken));

    expect(meRes.body.data.privacy.showEmail).toBe(true);
  });

  it('privacy update is recorded in activity log', async () => {
    await request(app)
      .patch('/api/users/privacy')
      .set(bearer(accessToken))
      .send({ showPhone: true });

    const logRes = await request(app)
      .get('/api/users/activity')
      .set(bearer(accessToken));

    const actions = logRes.body.data.map((e) => e.action);
    expect(actions).toContain('privacy_updated');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FLOW 5: Login history — record, read, clear
// ─────────────────────────────────────────────────────────────────────────────
describe('Flow: login history lifecycle', () => {
  it('login history grows after each login', async () => {
    const before = await request(app)
      .get('/api/users/login-history')
      .set(bearer(accessToken));
    const countBefore = before.body.data.length;

    await request(app)
      .post('/api/auth/login')
      .send({ email: BASE_USER.email, password: BASE_USER.password });

    const after = await request(app)
      .get('/api/users/login-history')
      .set(bearer(accessToken));

    expect(after.body.data.length).toBeGreaterThan(countBefore);
  });

  it('clearing login history results in empty array', async () => {
    await request(app)
      .delete('/api/users/login-history')
      .set(bearer(accessToken));

    const res = await request(app)
      .get('/api/users/login-history')
      .set(bearer(accessToken));

    expect(res.body.data).toHaveLength(0);
  });

  it('clear login history is recorded in activity log', async () => {
    await request(app)
      .delete('/api/users/login-history')
      .set(bearer(accessToken));

    const logRes = await request(app)
      .get('/api/users/activity')
      .set(bearer(accessToken));

    const actions = logRes.body.data.map((e) => e.action);
    expect(actions).toContain('login_history_cleared');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FLOW 6: Activity log — accumulates and clears
// ─────────────────────────────────────────────────────────────────────────────
describe('Flow: activity log lifecycle', () => {
  it('activity log accumulates entries from multiple actions', async () => {
    // Perform several actions
    await request(app)
      .patch('/api/users/update')
      .set(bearer(accessToken))
      .send({ bio: 'Activity test' });

    await request(app)
      .patch('/api/users/preferences')
      .set(bearer(accessToken))
      .send({ currency: 'USD' });

    const logRes = await request(app)
      .get('/api/users/activity')
      .set(bearer(accessToken));

    expect(logRes.body.data.length).toBeGreaterThan(0);
  });

  it('clearing activity log results in empty array', async () => {
    await request(app)
      .delete('/api/users/activity')
      .set(bearer(accessToken));

    const res = await request(app)
      .get('/api/users/activity')
      .set(bearer(accessToken));

    expect(res.body.data).toHaveLength(0);
  });

  it('each activity entry has action, timestamp, and ip fields', async () => {
    await request(app)
      .patch('/api/users/update')
      .set(bearer(accessToken))
      .send({ bio: 'Field check' });

    const logRes = await request(app)
      .get('/api/users/activity')
      .set(bearer(accessToken));

    const entry = logRes.body.data[0];
    expect(entry).toHaveProperty('action');
    expect(entry).toHaveProperty('timestamp');
    expect(entry).toHaveProperty('ip');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FLOW 7: Sessions — revoke individual and all
// ─────────────────────────────────────────────────────────────────────────────
describe('Flow: session management', () => {
  const SESS_USER = {
    username: 'sessuser',
    email:    'sess@neotravel.com',
    password: 'Test@1234',
  };

  let sessToken;

  beforeEach(async () => {
    await User.deleteMany({ email: SESS_USER.email });
    const res = await request(app).post('/api/auth/signup').send(SESS_USER);
    sessToken = res.body.data.accessToken;
  });

  afterEach(async () => {
    await User.deleteMany({ email: SESS_USER.email });
  });

  it('GET /sessions returns an array', async () => {
    const res = await request(app)
      .get('/api/users/sessions')
      .set(bearer(sessToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('revoking all sessions clears the sessions array', async () => {
    await request(app)
      .delete('/api/users/sessions')
      .set(bearer(sessToken));

    const res = await request(app)
      .get('/api/users/sessions')
      .set(bearer(sessToken));

    expect(res.body.data).toHaveLength(0);
  });

  it('revoking all sessions is recorded in activity log', async () => {
    await request(app)
      .delete('/api/users/sessions')
      .set(bearer(sessToken));

    const logRes = await request(app)
      .get('/api/users/activity')
      .set(bearer(sessToken));

    const actions = logRes.body.data.map((e) => e.action);
    expect(actions).toContain('all_sessions_revoked');
  });

  it('revoking a non-existent session ID returns 200 gracefully', async () => {
    const res = await request(app)
      .delete('/api/users/sessions/nonexistent-session-id')
      .set(bearer(sessToken));
    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FLOW 8: Data export contains all expected sections
// ─────────────────────────────────────────────────────────────────────────────
describe('Flow: data export', () => {
  it('export contains profile, preferences, privacy, loginHistory, activityLog', async () => {
    const res = await request(app)
      .get('/api/users/export')
      .set(bearer(accessToken));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('profile');
    expect(res.body.data).toHaveProperty('preferences');
    expect(res.body.data).toHaveProperty('privacy');
    expect(res.body.data).toHaveProperty('loginHistory');
    expect(res.body.data).toHaveProperty('activityLog');
    expect(res.body.data).toHaveProperty('exportedAt');
  });

  it('export profile contains correct email', async () => {
    const res = await request(app)
      .get('/api/users/export')
      .set(bearer(accessToken));

    expect(res.body.data.profile.email).toBe(BASE_USER.email);
  });

  it('export does not contain password or refreshToken', async () => {
    const res = await request(app)
      .get('/api/users/export')
      .set(bearer(accessToken));

    const bodyStr = JSON.stringify(res.body.data);
    expect(bodyStr).not.toMatch(/"password"/);
    expect(bodyStr).not.toMatch(/"refreshToken"/);
  });

  it('export is recorded in activity log', async () => {
    await request(app)
      .get('/api/users/export')
      .set(bearer(accessToken));

    const logRes = await request(app)
      .get('/api/users/activity')
      .set(bearer(accessToken));

    const actions = logRes.body.data.map((e) => e.action);
    expect(actions).toContain('data_exported');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FLOW 9: Avatar upload and removal
// ─────────────────────────────────────────────────────────────────────────────
describe('Flow: avatar upload and removal', () => {
  const AVT_USER = {
    username: 'avataruser',
    email:    'avatar@neotravel.com',
    password: 'Test@1234',
  };

  let avtToken;

  beforeEach(async () => {
    await User.deleteMany({ email: AVT_USER.email });
    const res = await request(app).post('/api/auth/signup').send(AVT_USER);
    avtToken = res.body.data.accessToken;
  });

  afterEach(async () => {
    await User.deleteMany({ email: AVT_USER.email });
  });

  it('uploading avatar stores a data URI in profileImage', async () => {
    const fakeBase64 = Buffer.from('fake-image-data').toString('base64');

    const res = await request(app)
      .post('/api/users/avatar')
      .set(bearer(avtToken))
      .send({ imageBase64: fakeBase64, mimeType: 'image/jpeg' });

    expect(res.status).toBe(200);
    expect(res.body.data.profileImage).toMatch(/^data:image\/jpeg;base64,/);
  });

  it('uploaded avatar is returned by /me', async () => {
    const fakeBase64 = Buffer.from('fake-image-data').toString('base64');

    await request(app)
      .post('/api/users/avatar')
      .set(bearer(avtToken))
      .send({ imageBase64: fakeBase64, mimeType: 'image/png' });

    const meRes = await request(app)
      .get('/api/users/me')
      .set(bearer(avtToken));

    expect(meRes.body.data.profileImage).toMatch(/^data:image\/png;base64,/);
  });

  it('deleting avatar clears profileImage in /me', async () => {
    const fakeBase64 = Buffer.from('fake-image-data').toString('base64');

    await request(app)
      .post('/api/users/avatar')
      .set(bearer(avtToken))
      .send({ imageBase64: fakeBase64, mimeType: 'image/jpeg' });

    await request(app)
      .delete('/api/users/avatar')
      .set(bearer(avtToken));

    const meRes = await request(app)
      .get('/api/users/me')
      .set(bearer(avtToken));

    expect(meRes.body.data.profileImage).toBe('');
  });

  it('avatar upload without imageBase64 returns 400', async () => {
    const res = await request(app)
      .post('/api/users/avatar')
      .set(bearer(avtToken))
      .send({});
    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FLOW 10: Account deletion removes user from DB
// ─────────────────────────────────────────────────────────────────────────────
describe('Flow: account deletion', () => {
  const DEL_USER = {
    username: 'deleteflowuser',
    email:    'deleteflow@neotravel.com',
    password: 'Test@1234',
  };

  afterEach(async () => {
    await User.deleteMany({ email: DEL_USER.email });
  });

  it('deleted account no longer exists in DB', async () => {
    const { body: { data } } = await request(app)
      .post('/api/auth/signup').send(DEL_USER);

    await request(app)
      .delete('/api/users/delete')
      .set(bearer(data.accessToken));

    const user = await User.findOne({ email: DEL_USER.email });
    expect(user).toBeNull();
  });

  it('deleted account token no longer works for /me', async () => {
    const { body: { data } } = await request(app)
      .post('/api/auth/signup').send(DEL_USER);

    await request(app)
      .delete('/api/users/delete')
      .set(bearer(data.accessToken));

    const meRes = await request(app)
      .get('/api/users/me')
      .set(bearer(data.accessToken));

    expect(meRes.status).toBe(401);
  });
});
