// src/controllers/favorite.controller.js
const Favorite  = require('../models/Favorite');
const Package   = require('../models/Package');
const AppError  = require('../utils/AppError');
const respond   = require('../utils/ApiResponse');

/**
 * POST /api/favorites
 * Toggle-style: add if not exists, remove if already favorited.
 * Body: { packageId }
 */
exports.toggleFavorite = async (req, res, next) => {
  try {
    const { packageId } = req.body;
    if (!packageId) return next(new AppError('packageId is required', 400));

    // Verify the package exists
    const pkg = await Package.findById(packageId);
    if (!pkg) return next(new AppError('Package not found', 404));

    const existing = await Favorite.findOne({ userId: req.user._id, packageId });

    if (existing) {
      // Already favorited → remove
      await existing.deleteOne();
      return respond(res).ok('Removed from favorites', { favorited: false, packageId });
    }

    // Not favorited → add
    await Favorite.create({ userId: req.user._id, packageId });
    return respond(res).created('Added to favorites', { favorited: true, packageId });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/favorites
 * Returns all favorited packages for the logged-in user.
 */
exports.getMyFavorites = async (req, res, next) => {
  try {
    const favorites = await Favorite.find({ userId: req.user._id })
      .populate('packageId', 'title description destination duration price image createdAt')
      .sort({ createdAt: -1 })
      .lean();

    // Flatten: expose package fields directly + include favoriteId, notes, priority
    const packages = favorites
      .filter(f => f.packageId) // guard against deleted packages
      .map(f => ({
        favoriteId:  f._id,
        favoritedAt: f.createdAt,
        notes:       f.notes,
        priority:    f.priority,
        ...f.packageId,
      }));

    return respond(res).ok('Favorites fetched successfully', { favorites: packages, count: packages.length });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/favorites/:packageId
 * Update the notes and/or priority of an existing favorite.
 * Body: { notes?, priority? }
 */
exports.updateFavorite = async (req, res, next) => {
  try {
    const { packageId } = req.params;
    const { notes, priority } = req.body;

    // Validate notes length if provided
    const NOTES_MAX = 50;
    if (notes !== undefined && notes.length > NOTES_MAX) {
      return next(new AppError(`notes must be ${NOTES_MAX} characters or fewer`, 400));
    }

    // Validate priority value if provided
    const VALID_PRIORITIES = ['low', 'medium', 'high'];
    if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
      return next(new AppError(`priority must be one of: ${VALID_PRIORITIES.join(', ')}`, 400));
    }

    // Build only the fields that were sent
    const updateFields = {};
    if (notes    !== undefined) updateFields.notes    = notes;
    if (priority !== undefined) updateFields.priority = priority;

    if (Object.keys(updateFields).length === 0) {
      return next(new AppError('Provide at least one field to update: notes or priority', 400));
    }

    const favorite = await Favorite.findOneAndUpdate(
      { userId: req.user._id, packageId },
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!favorite) return next(new AppError('Favorite not found', 404));

    return respond(res).ok('Favorite updated successfully', {
      favoriteId: favorite._id,
      packageId:  favorite.packageId,
      notes:      favorite.notes,
      priority:   favorite.priority,
      updatedAt:  favorite.updatedAt,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/favorites/:packageId
 * Explicitly remove a package from favorites.
 */
exports.removeFavorite = async (req, res, next) => {
  try {
    const { packageId } = req.params;

    const favorite = await Favorite.findOneAndDelete({ userId: req.user._id, packageId });

    if (!favorite) return next(new AppError('Favorite not found', 404));

    return respond(res).ok('Removed from favorites', { favorited: false, packageId });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/favorites/check/:packageId
 * Check whether the logged-in user has favorited a specific package.
 */
exports.checkFavorite = async (req, res, next) => {
  try {
    const { packageId } = req.params;

    const existing = await Favorite.findOne({ userId: req.user._id, packageId });

    return respond(res).ok('Check complete', {
      favorited: !!existing,
      packageId,
    });
  } catch (error) {
    next(error);
  }
};
