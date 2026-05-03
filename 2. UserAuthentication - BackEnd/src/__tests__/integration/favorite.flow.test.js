/**
 * Integration tests — Favorites Flow
 *
 * Tests the complete favorites journey: toggle (add), update, list, check, and remove.
 * Runs in isolation — only touches Favorite, Package, and User documents
 * created within this file. Does NOT affect other test suites.
 */

process.env.JWT_SECRET     = 'test_secret';
process.env.REFRESH_SECRET = 'test_refresh';
process.env.JWT_EXPIRES_IN = '15m';

const request  = require('supertest');
const mongoose = require('mongoose');
const app      = require('../../../server');
const User     = require('../../models/User.model');
const Package  = require('../../models/Package');
const Favorite = require('../../models/Favorite');

// ─── Test data ────────────────────────────────────────────────────────────────
const TEST_USER = {
  username: 'favtestuser',
  email:    'favtest@neotravel.com',
  password: 'Test@1234',
  phone:    '+9411111111',
};

// Helper: auth header
const bearer = (token) => ({ Authorization: `Bearer ${token}` });

// ─── Shared state ──────────────────────────────────────────────────────────
let accessToken;
let testPackageId;
let testUserId;

// ─── DB lifecycle ─────────────────────────────────────────────────────────────
beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/neotravel_test');

  // Create test user and get token
  const signupRes = await request(app)
    .post('/api/auth/signup')
    .send(TEST_USER);

  accessToken = signupRes.body.data?.accessToken;
  testUserId  = signupRes.body.data?.user?._id;

  // Create a test package directly in DB (admin action bypassed for isolation)
  const pkg = await Package.create({
    title:       'Test Maldives Package',
    description: 'Beautiful beach resort in the Maldives',
    destination: 'Maldives',
    duration:    7,
    price:       2500,
    createdBy:   testUserId,
  });
  testPackageId = pkg._id.toString();
});

afterAll(async () => {
  // Clean up only test data created by this suite
  await Favorite.deleteMany({ userId: testUserId });
  await Package.deleteMany({ title: 'Test Maldives Package' });
  await User.deleteMany({ email: TEST_USER.email });
  await mongoose.connection.close();
});

// Reset favorites before each test for a clean slate
beforeEach(async () => {
  await Favorite.deleteMany({ userId: testUserId });
});

// ─────────────────────────────────────────────────────────────────────────────
// FLOW 1: Authentication guard
// ─────────────────────────────────────────────────────────────────────────────
describe('Favorites: authentication guard', () => {
  it('GET /api/favorites returns 401 without token', async () => {
    const res = await request(app).get('/api/favorites');
    expect(res.status).toBe(401);
  });

  it('POST /api/favorites returns 401 without token', async () => {
    const res = await request(app)
      .post('/api/favorites')
      .send({ packageId: testPackageId });
    expect(res.status).toBe(401);
  });

  it('PATCH /api/favorites/:packageId returns 401 without token', async () => {
    const res = await request(app)
      .patch(`/api/favorites/${testPackageId}`)
      .send({ notes: 'test' });
    expect(res.status).toBe(401);
  });

  it('DELETE /api/favorites/:packageId returns 401 without token', async () => {
    const res = await request(app).delete(`/api/favorites/${testPackageId}`);
    expect(res.status).toBe(401);
  });

  it('GET /api/favorites/check/:packageId returns 401 without token', async () => {
    const res = await request(app).get(`/api/favorites/check/${testPackageId}`);
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FLOW 2: Add to favorites (toggle — add)
// ─────────────────────────────────────────────────────────────────────────────
describe('Favorites: add to favorites', () => {
  it('POST /api/favorites adds a package and returns favorited: true', async () => {
    const res = await request(app)
      .post('/api/favorites')
      .set(bearer(accessToken))
      .send({ packageId: testPackageId });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.favorited).toBe(true);
    expect(res.body.data.packageId).toBe(testPackageId);
  });

  it('POST /api/favorites with missing packageId returns 400', async () => {
    const res = await request(app)
      .post('/api/favorites')
      .set(bearer(accessToken))
      .send({});

    expect(res.status).toBe(400);
  });

  it('POST /api/favorites with non-existent packageId returns 404', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .post('/api/favorites')
      .set(bearer(accessToken))
      .send({ packageId: fakeId });

    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FLOW 3: Toggle — remove when already favorited
// ─────────────────────────────────────────────────────────────────────────────
describe('Favorites: toggle behavior', () => {
  it('second POST removes the favorite and returns favorited: false', async () => {
    // Add first
    await request(app)
      .post('/api/favorites')
      .set(bearer(accessToken))
      .send({ packageId: testPackageId });

    // Toggle off
    const res = await request(app)
      .post('/api/favorites')
      .set(bearer(accessToken))
      .send({ packageId: testPackageId });

    expect(res.status).toBe(200);
    expect(res.body.data.favorited).toBe(false);
  });

  it('toggling twice ends up with no favorite in DB', async () => {
    // Add
    await request(app)
      .post('/api/favorites')
      .set(bearer(accessToken))
      .send({ packageId: testPackageId });
    // Remove via toggle
    await request(app)
      .post('/api/favorites')
      .set(bearer(accessToken))
      .send({ packageId: testPackageId });

    const count = await Favorite.countDocuments({ userId: testUserId, packageId: testPackageId });
    expect(count).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FLOW 4: Get my favorites
// ─────────────────────────────────────────────────────────────────────────────
describe('Favorites: get all favorites', () => {
  it('GET /api/favorites returns empty array when no favorites', async () => {
    const res = await request(app)
      .get('/api/favorites')
      .set(bearer(accessToken));

    expect(res.status).toBe(200);
    expect(res.body.data.favorites).toEqual([]);
    expect(res.body.data.count).toBe(0);
  });

  it('GET /api/favorites returns the favorited package with populated fields', async () => {
    // Add favorite first
    await request(app)
      .post('/api/favorites')
      .set(bearer(accessToken))
      .send({ packageId: testPackageId });

    const res = await request(app)
      .get('/api/favorites')
      .set(bearer(accessToken));

    expect(res.status).toBe(200);
    expect(res.body.data.count).toBe(1);

    const fav = res.body.data.favorites[0];
    expect(fav._id.toString()).toBe(testPackageId);
    expect(fav.title).toBe('Test Maldives Package');
    expect(fav).toHaveProperty('favoriteId');
    expect(fav).toHaveProperty('favoritedAt');
  });

  it('GET /api/favorites only returns favorites of the logged-in user', async () => {
    // Create a second user
    const user2Res = await request(app)
      .post('/api/auth/signup')
      .send({ username: 'user2fav', email: 'user2fav@neotravel.com', password: 'Test@1234' });

    const token2 = user2Res.body.data?.accessToken;

    // user2 favorites the package
    await request(app)
      .post('/api/favorites')
      .set(bearer(token2))
      .send({ packageId: testPackageId });

    // Original user has no favorites
    const res = await request(app)
      .get('/api/favorites')
      .set(bearer(accessToken));

    expect(res.body.data.count).toBe(0);

    // Cleanup user2
    await User.deleteMany({ email: 'user2fav@neotravel.com' });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FLOW 5: Check if a package is favorited
// ─────────────────────────────────────────────────────────────────────────────
describe('Favorites: check favorite status', () => {
  it('GET /api/favorites/check/:packageId returns favorited: false when not favorited', async () => {
    const res = await request(app)
      .get(`/api/favorites/check/${testPackageId}`)
      .set(bearer(accessToken));

    expect(res.status).toBe(200);
    expect(res.body.data.favorited).toBe(false);
  });

  it('GET /api/favorites/check/:packageId returns favorited: true after adding', async () => {
    await request(app)
      .post('/api/favorites')
      .set(bearer(accessToken))
      .send({ packageId: testPackageId });

    const res = await request(app)
      .get(`/api/favorites/check/${testPackageId}`)
      .set(bearer(accessToken));

    expect(res.status).toBe(200);
    expect(res.body.data.favorited).toBe(true);
    expect(res.body.data.packageId).toBe(testPackageId);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FLOW 6: Explicit DELETE remove
// ─────────────────────────────────────────────────────────────────────────────
describe('Favorites: explicit remove', () => {
  it('DELETE /api/favorites/:packageId removes the favorite', async () => {
    // Add first
    await request(app)
      .post('/api/favorites')
      .set(bearer(accessToken))
      .send({ packageId: testPackageId });

    // Delete
    const res = await request(app)
      .delete(`/api/favorites/${testPackageId}`)
      .set(bearer(accessToken));

    expect(res.status).toBe(200);
    expect(res.body.data.favorited).toBe(false);

    // Confirm gone from DB
    const count = await Favorite.countDocuments({ userId: testUserId, packageId: testPackageId });
    expect(count).toBe(0);
  });

  it('DELETE /api/favorites/:packageId returns 404 if not favorited', async () => {
    const res = await request(app)
      .delete(`/api/favorites/${testPackageId}`)
      .set(bearer(accessToken));

    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FLOW 7: Response shape consistency
// ─────────────────────────────────────────────────────────────────────────────
describe('Favorites: response shape', () => {
  it('all success responses have success:true, statusCode, message, data', async () => {
    const res = await request(app)
      .get('/api/favorites')
      .set(bearer(accessToken));

    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('statusCode', 200);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('data');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FLOW 8: Update favorite (notes & priority)
// ─────────────────────────────────────────────────────────────────────────────
describe('Favorites: update (notes & priority)', () => {
  // Add a favorite before each test in this group
  beforeEach(async () => {
    await request(app)
      .post('/api/favorites')
      .set(bearer(accessToken))
      .send({ packageId: testPackageId });
  });

  it('PATCH /api/favorites/:packageId updates notes and priority', async () => {
    const res = await request(app)
      .patch(`/api/favorites/${testPackageId}`)
      .set(bearer(accessToken))
      .send({ notes: 'Visit in December', priority: 'high' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.notes).toBe('Visit in December');
    expect(res.body.data.priority).toBe('high');
    expect(res.body.data.packageId.toString()).toBe(testPackageId);
  });

  it('PATCH updates only notes when priority is omitted', async () => {
    const res = await request(app)
      .patch(`/api/favorites/${testPackageId}`)
      .set(bearer(accessToken))
      .send({ notes: 'Only notes updated' });

    expect(res.status).toBe(200);
    expect(res.body.data.notes).toBe('Only notes updated');
    // priority should remain at default 'medium'
    expect(res.body.data.priority).toBe('medium');
  });

  it('PATCH updates only priority when notes is omitted', async () => {
    const res = await request(app)
      .patch(`/api/favorites/${testPackageId}`)
      .set(bearer(accessToken))
      .send({ priority: 'low' });

    expect(res.status).toBe(200);
    expect(res.body.data.priority).toBe('low');
  });

  it('PATCH with no fields returns 400', async () => {
    const res = await request(app)
      .patch(`/api/favorites/${testPackageId}`)
      .set(bearer(accessToken))
      .send({});

    expect(res.status).toBe(400);
  });

  it('PATCH with invalid priority returns 400', async () => {
    const res = await request(app)
      .patch(`/api/favorites/${testPackageId}`)
      .set(bearer(accessToken))
      .send({ priority: 'urgent' });

    expect(res.status).toBe(400);
  });

  it('PATCH on a non-favorited package returns 404', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .patch(`/api/favorites/${fakeId}`)
      .set(bearer(accessToken))
      .send({ notes: 'Trying to update non-existent' });

    expect(res.status).toBe(404);
  });

  it('PATCH persists changes to DB correctly', async () => {
    await request(app)
      .patch(`/api/favorites/${testPackageId}`)
      .set(bearer(accessToken))
      .send({ notes: 'Persisted note', priority: 'high' });

    const fav = await Favorite.findOne({ userId: testUserId, packageId: testPackageId });
    expect(fav.notes).toBe('Persisted note');
    expect(fav.priority).toBe('high');
  });

  it('PATCH updates are reflected in GET /api/favorites', async () => {
    await request(app)
      .patch(`/api/favorites/${testPackageId}`)
      .set(bearer(accessToken))
      .send({ notes: 'Reflected note', priority: 'low' });

    const listRes = await request(app)
      .get('/api/favorites')
      .set(bearer(accessToken));

    const fav = listRes.body.data.favorites[0];
    expect(fav.notes).toBe('Reflected note');
    expect(fav.priority).toBe('low');
  });

  it('PATCH returns 401 without token', async () => {
    const res = await request(app)
      .patch(`/api/favorites/${testPackageId}`)
      .send({ notes: 'No auth' });
    expect(res.status).toBe(401);
  });
});
