// src/routes/favorite.routes.js
const express = require('express');
const router  = express.Router();

const auth = require('../middleware/auth.middleware');

const {
  toggleFavorite,
  getMyFavorites,
  removeFavorite,
  checkFavorite,
} = require('../controllers/favorite.controller');

// All favorites routes require authentication
router.use(auth);

// POST   /api/favorites            → toggle (add or remove)
router.post('/', toggleFavorite);

// GET    /api/favorites            → get all favorites for logged-in user
router.get('/', getMyFavorites);

// DELETE /api/favorites/:packageId → explicitly remove from favorites
router.delete('/:packageId', removeFavorite);

// GET    /api/favorites/check/:packageId → check if a package is favorited
router.get('/check/:packageId', checkFavorite);

module.exports = router;
