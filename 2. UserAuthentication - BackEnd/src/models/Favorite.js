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

    // ── Update-able fields ──────────────────────────────────────────
    // Personal memo the user can attach to the saved package
    notes: {
      type:     String,
      default:  '',
      trim:     true,
      maxlength: 300,
    },

    // User-defined priority for trip planning
    priority: {
      type:    String,
      enum:    ['low', 'medium', 'high'],
      default: 'medium',
    },
  },
  { timestamps: true }
);

// Ensure a user can only favorite a package once
favoriteSchema.index({ userId: 1, packageId: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);
