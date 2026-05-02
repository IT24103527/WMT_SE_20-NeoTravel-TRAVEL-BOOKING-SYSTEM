/**
 * Integration tests — Review / Ratings Flow
 *
 * Tests the full review lifecycle using real auth, real package data,
 * and the review endpoints exactly as the mobile app would use them.
 */

process.env.JWT_SECRET     = 'test_secret';
process.env.REFRESH_SECRET = 'test_refresh';
process.env.JWT_EXPIRES_IN = '15m';

const request  = require('supertest');
const mongoose = require('mongoose');
const app      = require('../../../server');
const User     = require('../../models/User.model');
const Package  = require('../../models/Package');
const Review   = require('../../models/Review');

const BASE_USER = {
  username: 'reviewflowuser',
  email: 'reviewflow@neotravel.com',
  password: 'Test@1234',
  phone: '+1234567890',
};

const SECOND_USER = {
  username: 'reviewflowuser2',
  email: 'reviewflow2@neotravel.com',
  password: 'Test@1234',
  phone: '+1234567891',
};

let packageDoc;
let accessToken;
let secondAccessToken;

const bearer = (token) => ({ Authorization: `Bearer ${token}` });

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/neotravel_test');

  await Review.deleteMany({});
  await Package.deleteMany({ title: { $in: ['Review Flow Package', 'Review Flow Package 2'] } });
  await User.deleteMany({ email: { $in: [BASE_USER.email, SECOND_USER.email] } });

  const userRes = await request(app).post('/api/auth/signup').send(BASE_USER);
  accessToken = userRes.body.data.accessToken;

  const secondRes = await request(app).post('/api/auth/signup').send(SECOND_USER);
  secondAccessToken = secondRes.body.data.accessToken;

  packageDoc = await Package.create({
    title: 'Review Flow Package',
    description: 'Test package for review flow integration tests',
    price: 1500,
    image: 'review-test.jpg',
    createdBy: userRes.body.data.user.id,
  });
});

beforeEach(async () => {
  await Review.deleteMany({});
});

afterAll(async () => {
  await Review.deleteMany({});
  await Package.deleteMany({ title: { $in: ['Review Flow Package', 'Review Flow Package 2'] } });
  await User.deleteMany({ email: { $in: [BASE_USER.email, SECOND_USER.email] } });
  await mongoose.connection.close();
});

describe('Flow: review lifecycle', () => {
  it('authenticated user can add a review and it appears in package reviews', async () => {
    const createRes = await request(app)
      .post('/api/reviews')
      .set(bearer(accessToken))
      .send({
        packageId: packageDoc._id,
        rating: 5,
        comment: 'Excellent package and smooth booking experience',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.rating).toBe(5);
    expect(createRes.body.data.comment).toBe('Excellent package and smooth booking experience');

    const listRes = await request(app)
      .get(`/api/reviews/package/${packageDoc._id}`)
      .set(bearer(accessToken));

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.reviews).toHaveLength(1);
    expect(listRes.body.data.summary.reviewCount).toBe(1);
    expect(listRes.body.data.summary.averageRating).toBe(5);
  });

  it('review summary updates after multiple reviews', async () => {
    await request(app)
      .post('/api/reviews')
      .set(bearer(accessToken))
      .send({ packageId: packageDoc._id, rating: 4, comment: 'A very good trip and lovely memories' });

    await request(app)
      .post('/api/reviews')
      .set(bearer(secondAccessToken))
      .send({ packageId: packageDoc._id, rating: 2, comment: 'Could be better' });

    const listRes = await request(app)
      .get(`/api/reviews/package/${packageDoc._id}`)
      .set(bearer(accessToken));

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.reviews).toHaveLength(2);
    expect(listRes.body.data.summary.reviewCount).toBe(2);
    expect(listRes.body.data.summary.averageRating).toBeCloseTo(3, 0);
  });

  it('rejects duplicate review from the same user for the same package', async () => {
    await request(app)
      .post('/api/reviews')
      .set(bearer(accessToken))
      .send({ packageId: packageDoc._id, rating: 5, comment: 'First review' });

    const duplicateRes = await request(app)
      .post('/api/reviews')
      .set(bearer(accessToken))
      .send({ packageId: packageDoc._id, rating: 4, comment: 'Second review' });

    expect(duplicateRes.status).toBe(409);
  });

  it('rejects invalid rating values', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set(bearer(accessToken))
      .send({ packageId: packageDoc._id, rating: 7, comment: 'Invalid rating' });

    expect(res.status).toBe(400);
  });

  it('rejects missing rating when creating a review', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set(bearer(accessToken))
      .send({ packageId: packageDoc._id, comment: 'Has comment but no rating' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/rating/i);
  });

  it('rejects short comment (<11 chars) when creating a review', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set(bearer(accessToken))
      .send({ packageId: packageDoc._id, rating: 4, comment: 'Too short' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/greater than 10/i);
  });

  it('rejects comment containing numeric characters when creating a review', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set(bearer(accessToken))
      .send({ packageId: packageDoc._id, rating: 4, comment: 'This has numbers 1234' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/numbers/i);
  });

  it('rejects missing packageId when creating a review', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set(bearer(accessToken))
      .send({ rating: 5, comment: 'Missing package id' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/packageid/i);
  });

  it('rejects empty comment when creating a review', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set(bearer(accessToken))
      .send({ packageId: packageDoc._id, rating: 4, comment: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/comment/i);
  });

  it('rejects review creation without authentication', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .send({ packageId: packageDoc._id, rating: 5, comment: 'No token' });

    expect(res.status).toBe(401);
  });

  it('review owner can delete their review', async () => {
    const createRes = await request(app)
      .post('/api/reviews')
      .set(bearer(accessToken))
      .send({ packageId: packageDoc._id, rating: 5, comment: 'Please delete this review' });

    const reviewId = createRes.body.data._id;

    const deleteRes = await request(app)
      .delete(`/api/reviews/${reviewId}`)
      .set(bearer(accessToken));

    expect(deleteRes.status).toBe(200);

    const checkRes = await request(app)
      .get(`/api/reviews/package/${packageDoc._id}`)
      .set(bearer(accessToken));

    expect(checkRes.body.data.reviews).toHaveLength(0);
  });

  it('review owner can update their review', async () => {
    const createRes = await request(app)
      .post('/api/reviews')
      .set(bearer(accessToken))
      .send({ packageId: packageDoc._id, rating: 3, comment: 'Initial review' });

    const reviewId = createRes.body.data._id;

    const updateRes = await request(app)
      .patch(`/api/reviews/${reviewId}`)
      .set(bearer(accessToken))
      .send({ rating: 5, comment: 'Updated review text' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.rating).toBe(5);
    expect(updateRes.body.data.comment).toBe('Updated review text');

    const checkRes = await request(app)
      .get(`/api/reviews/package/${packageDoc._id}`)
      .set(bearer(accessToken));

    expect(checkRes.body.data.reviews[0].rating).toBe(5);
    expect(checkRes.body.data.reviews[0].comment).toBe('Updated review text');
  });

  it('another user cannot delete someone else review', async () => {
    const createRes = await request(app)
      .post('/api/reviews')
      .set(bearer(accessToken))
      .send({ packageId: packageDoc._id, rating: 5, comment: 'Protected review' });

    const reviewId = createRes.body.data._id;

    const deleteRes = await request(app)
      .delete(`/api/reviews/${reviewId}`)
      .set(bearer(secondAccessToken));

    expect(deleteRes.status).toBe(403);
  });

  it('package review request returns empty state for packages without reviews', async () => {
    const emptyPackage = await Package.create({
      title: 'Review Flow Package 2',
      description: 'Empty review package',
      price: 900,
      image: 'review-empty.jpg',
      createdBy: mongoose.Types.ObjectId.isValid(packageDoc.createdBy)
        ? packageDoc.createdBy
        : undefined,
    });

    const res = await request(app)
      .get(`/api/reviews/package/${emptyPackage._id}`)
      .set(bearer(accessToken));

    expect(res.status).toBe(200);
    expect(res.body.data.reviews).toHaveLength(0);
    expect(res.body.data.summary.reviewCount).toBe(0);
    expect(res.body.data.summary.averageRating).toBe(0);
  });
});