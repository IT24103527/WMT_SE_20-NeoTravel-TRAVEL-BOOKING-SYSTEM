// src/models/Package.js
const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  title: String,
  description: String,
  destination: String,
  duration: Number,
  price: Number,
  image: String,

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }

}, { timestamps: true });

module.exports = mongoose.model('Package', packageSchema);