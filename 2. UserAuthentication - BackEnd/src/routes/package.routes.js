// src/routes/package.routes.js
const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth.middleware');
const admin = require('../middleware/admin.middleware');

const {
  getPackages,
  getPackage,
  createPackage,
  updatePackage,
  deletePackage
} = require('../controllers/package.controller');

// Public
router.get('/', getPackages);
router.get('/:id', getPackage);

// Admin only
router.post('/', auth, admin, createPackage);
router.patch('/:id', auth, admin, updatePackage);
router.delete('/:id', auth, admin, deletePackage);

module.exports = router;