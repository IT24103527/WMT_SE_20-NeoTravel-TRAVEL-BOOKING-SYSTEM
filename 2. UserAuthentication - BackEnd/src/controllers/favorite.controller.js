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

    // Flatten: expose package fields directly + include favoriteId
    const packages = favorites
      .filter(f => f.packageId) // guard against deleted packages
      .map(f => ({
        favoriteId: f._id,
        favoritedAt: f.createdAt,
        ...f.packageId,
      }));

    return respond(res).ok('Favorites fetched successfully', { favorites: packages, count: packages.length });
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
