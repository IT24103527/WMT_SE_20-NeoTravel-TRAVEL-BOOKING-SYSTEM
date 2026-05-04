// src/models/Booking.js
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  package: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Package', 
    required: true 
  },
  bookingDate: { 
    type: Date, 
    required: true 
  },
  travelers: {
    type: Number,
    default: 1,
    min: 1
  },
  specialRequests: {
    type: String,
    default: ''
  },
  totalPrice: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);