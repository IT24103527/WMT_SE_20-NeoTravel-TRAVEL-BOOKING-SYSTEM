// src/routes/favorite.routes.js
const express = require('express');
const router  = express.Router();

const auth = require('../middleware/auth.middleware');

const {
  toggleFavorite,
  getMyFavorites,
  updateFavorite,
  removeFavorite,
  checkFavorite,
} = require('../controllers/favorite.controller');

// All favorites routes require authentication
router.use(auth);

// POST   /api/favorites                  → toggle (add or remove)
router.post('/', toggleFavorite);

// GET    /api/favorites                  → get all favorites for logged-in user
router.get('/', getMyFavorites);

// PATCH  /api/favorites/:packageId       → update notes / priority of a favorite
router.patch('/:packageId', updateFavorite);

// DELETE /api/favorites/:packageId       → explicitly remove from favorites
router.delete('/:packageId', removeFavorite);

// GET    /api/favorites/check/:packageId → check if a package is favorited
router.get('/check/:packageId', checkFavorite);

module.exports = router;
