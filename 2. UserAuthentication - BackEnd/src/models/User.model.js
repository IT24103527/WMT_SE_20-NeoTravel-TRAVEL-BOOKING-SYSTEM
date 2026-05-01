const mongoose = require('mongoose');

const loginHistorySchema = new mongoose.Schema({
  ip:        { type: String, default: '' },
  device:    { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
  success:   { type: Boolean, default: true },
}, { _id: false });

const userSchema = new mongoose.Schema(
  {
    username:     { type: String, required: true, trim: true },
    email:        { type: String, required: true, unique: true, lowercase: true },
    password:     { type: String, required: true },
    role: {type: String,enum: ['user', 'admin'],default: 'user'},
    phone:        { type: String, default: '' },
    profileImage: { type: String, default: '' },
    bio:          { type: String, default: '', maxlength: 200 },

    // Email verification
    isVerified:       { type: Boolean, default: false },
    verifyToken:      { type: String, default: null },
    verifyTokenExpiry:{ type: Date,   default: null },

    // Password reset
    resetToken:       { type: String, default: null },
    resetTokenExpiry: { type: Date,   default: null },

    // Refresh token
    refreshToken:     { type: String, default: null },

    // Login history (last 10)
    loginHistory: { type: [loginHistorySchema], default: [] },

    // Account status
    isActive:     { type: Boolean, default: true },
    lastSeen:     { type: Date,    default: null },

    // User preferences (persisted)
    preferences:  {
      travelStyles: { type: [String], default: [] },
      notifications: {
        push:  { type: Boolean, default: true },
        email: { type: Boolean, default: false },
      },
      biometric: { type: Boolean, default: false },
      currency:  { type: String, default: 'USD' },
      language:  { type: String, default: 'en' },
    },

    // Privacy settings
    privacy: {
      profileVisible:  { type: Boolean, default: true },
      showEmail:       { type: Boolean, default: false },
      showPhone:       { type: Boolean, default: false },
      showLastSeen:    { type: Boolean, default: true },
    },

    // Two-Factor Auth (TOTP)
    twoFactor: {
      enabled: { type: Boolean, default: false },
      secret:  { type: String,  default: null },
    },

    // Active sessions (last 5)
    sessions: [{
      sessionId:  { type: String },
      device:     { type: String, default: '' },
      ip:         { type: String, default: '' },
      createdAt:  { type: Date,   default: Date.now },
      lastActive: { type: Date,   default: Date.now },
    }],

    // Account activity log (last 20)
    activityLog: [{
      action:    { type: String },
      detail:    { type: String, default: '' },
      ip:        { type: String, default: '' },
      timestamp: { type: Date,   default: Date.now },
    }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
