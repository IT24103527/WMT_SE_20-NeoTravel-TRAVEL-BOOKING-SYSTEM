// src/models/Favorite.js
const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Package',
      required: true,
    },
  },
  { timestamps: true }
);

// Ensure a user can only favorite a package once
favoriteSchema.index({ userId: 1, packageId: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);
