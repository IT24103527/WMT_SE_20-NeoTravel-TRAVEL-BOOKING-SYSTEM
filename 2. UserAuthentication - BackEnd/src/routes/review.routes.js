const express = require('express');
const protectRoute = require('../middleware/auth.middleware');
const {
  createReview,
  getPackageReviews,
  updateReview,
  deleteReview,
} = require('../controllers/review.controller');

const router = express.Router();

router.use(protectRoute);

router.get('/package/:packageId', getPackageReviews);
router.post('/', createReview);
router.patch('/:id', updateReview);
router.delete('/:id', deleteReview);

module.exports = router;