const jwt    = require('jsonwebtoken');
const crypto = require('crypto');

const generateAccessToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });

const generateRefreshToken = (userId) =>
  jwt.sign({ id: userId }, process.env.REFRESH_SECRET || process.env.JWT_SECRET + '_refresh', {
    expiresIn: '7d',
  });

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP

const generateSecureToken = () =>
  crypto.randomBytes(32).toString('hex');

module.exports = { generateAccessToken, generateRefreshToken, generateOTP, generateSecureToken };
