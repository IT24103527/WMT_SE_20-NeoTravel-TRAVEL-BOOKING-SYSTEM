const mongoose = require('mongoose');
const Package = require('../models/Package');
const Review = require('../models/Review');

const buildSummary = async (packageId) => {
  const [summary] = await Review.aggregate([
    { $match: { packageId: new mongoose.Types.ObjectId(packageId) } },
    {
      $group: {
        _id: '$packageId',
        reviewCount: { $sum: 1 },
        averageRating: { $avg: '$rating' },
      },
    },
  ]);

  return summary || { reviewCount: 0, averageRating: 0 };
};

// POST /api/reviews
exports.createReview = async (req, res) => {
  const { packageId, rating, comment } = req.body;

  if (!mongoose.isValidObjectId(packageId)) {
    return res.status(400).json({ success: false, message: 'Valid packageId is required' });
  }

  const parsedRating = Number(rating);
  const normalizedComment = String(comment || '').trim();

  // Require an explicit rating value
  if (rating === undefined || rating === null || rating === '') {
    return res.status(400).json({ success: false, message: 'Rating is required' });
  }

  if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
  }

  // Require comment and enforce minimum length (>10 chars)
  if (!normalizedComment) {
    return res.status(400).json({ success: false, message: 'Comment is required' });
  }

  if (normalizedComment.length <= 10) {
    return res.status(400).json({ success: false, message: 'Comment must be greater than 10 characters' });
  }

  // Disallow numeric characters in comment
  if (/\d/.test(normalizedComment)) {
    return res.status(400).json({ success: false, message: 'Comment must not contain numbers' });
  }

  const pkg = await Package.findById(packageId);
  if (!pkg) {
    return res.status(404).json({ success: false, message: 'Package not found' });
  }

  const existingReview = await Review.findOne({ packageId, userId: req.user._id });
  if (existingReview) {
    return res.status(409).json({
      success: false,
      message: 'You have already reviewed this package',
    });
  }

  const review = await Review.create({
    packageId,
    userId: req.user._id,
    rating: parsedRating,
    comment: normalizedComment,
  });

  const populatedReview = await Review.findById(review._id)
    .populate('userId', 'username profileImage role')
    .populate('packageId', 'title');

  return res.status(201).json({
    success: true,
    message: 'Review added successfully',
    data: populatedReview,
  });
};

// GET /api/reviews/package/:packageId
exports.getPackageReviews = async (req, res) => {
  const { packageId } = req.params;

  if (!mongoose.isValidObjectId(packageId)) {
    return res.status(400).json({ success: false, message: 'Valid packageId is required' });
  }

  const reviews = await Review.find({ packageId })
    .populate('userId', 'username profileImage role')
    .sort({ createdAt: -1 });

  const normalizedReviews = reviews.map((review) => {
    const reviewObject = review.toObject();
    const isOwner = review.userId?._id?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    return {
      ...reviewObject,
      canDelete: isOwner || isAdmin,
      canEdit: isOwner || isAdmin,
    };
  });

  const summary = await buildSummary(packageId);

  return res.json({
    success: true,
    data: {
      reviews: normalizedReviews,
      summary: {
        reviewCount: summary.reviewCount,
        averageRating: Number(summary.averageRating || 0),
      },
    },
  });
};

// PATCH /api/reviews/:id
exports.updateReview = async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({ success: false, message: 'Review not found' });
  }

  const isOwner = review.userId.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ success: false, message: 'Not allowed to edit this review' });
  }

  const parsedRating = Number(req.body.rating);
  const normalizedComment = String(req.body.comment || '').trim();

  // Require an explicit rating value
  if (req.body.rating === undefined || req.body.rating === null || req.body.rating === '') {
    return res.status(400).json({ success: false, message: 'Rating is required' });
  }

  if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
  }

  // Require comment and enforce minimum length (>10 chars)
  if (!normalizedComment) {
    return res.status(400).json({ success: false, message: 'Comment is required' });
  }

  if (normalizedComment.length <= 10) {
    return res.status(400).json({ success: false, message: 'Comment must be greater than 10 characters' });
  }

  // Disallow numeric characters in comment
  if (/\d/.test(normalizedComment)) {
    return res.status(400).json({ success: false, message: 'Comment must not contain numbers' });
  }

  review.rating = parsedRating;
  review.comment = normalizedComment;
  await review.save();

  const updatedReview = await Review.findById(review._id)
    .populate('userId', 'username profileImage role')
    .populate('packageId', 'title');

  return res.json({
    success: true,
    message: 'Review updated successfully',
    data: updatedReview,
  });
};

// DELETE /api/reviews/:id
exports.deleteReview = async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({ success: false, message: 'Review not found' });
  }

  const isOwner = review.userId.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ success: false, message: 'Not allowed to delete this review' });
  }

  await review.deleteOne();

  return res.json({
    success: true,
    message: 'Review deleted successfully',
  });
};