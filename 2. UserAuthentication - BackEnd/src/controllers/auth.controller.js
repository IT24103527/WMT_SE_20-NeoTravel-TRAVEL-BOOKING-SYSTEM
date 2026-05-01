const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const User      = require('../models/User.model');
const AppError  = require('../utils/AppError');
const respond   = require('../utils/ApiResponse');
const {
  generateAccessToken, generateRefreshToken,
  generateOTP,
} = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');

// ── Helper ───────────────────────────────────────────────────────────────────
const pushLoginHistory = (user, req, success) => {
  user.loginHistory.unshift({
    ip:        req.ip || '',
    device:    req.headers['user-agent']?.slice(0, 80) || 'Unknown',
    timestamp: new Date(),
    success,
  });
  if (user.loginHistory.length > 10)
    user.loginHistory = user.loginHistory.slice(0, 10);
};

// ── POST /api/auth/signup ────────────────────────────────────────────────────
const signup = async (req, res, next) => {
  try {
    const { username, email, password, phone } = req.body;

    if (await User.findOne({ email }))
      throw new AppError('Email already in use', 409);

    const hashed      = await bcrypt.hash(password, 10);
    const verifyToken = generateOTP();

    const user = await User.create({
      username, email,
      password: hashed,
      phone: phone || '',
      verifyToken,
      verifyTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await sendEmail({
      to: email,
      subject: 'Verify your NeoTravel account',
      html: `<h2>Welcome, ${username}!</h2>
             <p>Your verification code:</p>
             <h1 style="letter-spacing:8px;color:#C9A84C">${verifyToken}</h1>
             <p>Expires in 24 hours.</p>`,
    }).catch(() => {});

    const accessToken  = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken  = refreshToken;
    await user.save();

    respond(res).created('Account created', {
      accessToken, refreshToken,
      user: { id: user._id, username: user.username, email: user.email, isVerified: user.isVerified },
    });
  } catch (err) { next(err); }
};

// ── POST /api/auth/login ─────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) throw new AppError('Invalid credentials', 401);
    if (!user.isActive) throw new AppError('Account is deactivated', 403);

    const isMatch = await bcrypt.compare(password, user.password);
    pushLoginHistory(user, req, isMatch);

    if (!isMatch) {
      await user.save();
      throw new AppError('Invalid credentials', 401);
    }

    user.lastSeen = new Date();
    const accessToken  = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken  = refreshToken;
    await user.save();

    // Send login success email (non-blocking)
    const loginTime = new Date().toLocaleString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long',
      day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
    });
    const device = req.headers['user-agent']?.slice(0, 80) || 'Unknown device';
    const ip     = req.ip || 'Unknown';

    await sendEmail({
      to: user.email,
      subject: 'Successful Login — NeoTravel',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0A0A0F;color:#F5F0E8;padding:32px;border-radius:12px;">
          <h1 style="color:#C9A84C;margin-bottom:4px;">NeoTravel</h1>
          <p style="color:#8A8AA8;margin-top:0;">Your travel identity, secured.</p>
          <hr style="border-color:#1E1E3A;margin:24px 0;">
          <h2 style="color:#F5F0E8;">Successful Sign In</h2>
          <p style="color:#8A8AA8;">Hi <strong style="color:#F5F0E8;">${user.username}</strong>,</p>
          <p style="color:#8A8AA8;">Your NeoTravel account was successfully signed in. Here are the details:</p>
          <table style="width:100%;border-collapse:collapse;margin:20px 0;">
            <tr style="border-bottom:1px solid #1E1E3A;">
              <td style="padding:12px 0;color:#8A8AA8;width:40%;">Time</td>
              <td style="padding:12px 0;color:#F5F0E8;">${loginTime}</td>
            </tr>
            <tr style="border-bottom:1px solid #1E1E3A;">
              <td style="padding:12px 0;color:#8A8AA8;">IP Address</td>
              <td style="padding:12px 0;color:#F5F0E8;">${ip}</td>
            </tr>
            <tr>
              <td style="padding:12px 0;color:#8A8AA8;">Device</td>
              <td style="padding:12px 0;color:#F5F0E8;">${device}</td>
            </tr>
          </table>
          <p style="color:#8A8AA8;">If this was not you, please <strong style="color:#C9A84C;">change your password immediately</strong> and contact support.</p>
          <hr style="border-color:#1E1E3A;margin:24px 0;">
          <p style="color:#44445A;font-size:12px;">This is an automated security notification from NeoTravel. Do not reply to this email.</p>
        </div>
      `,
    }).catch(() => {}); // non-blocking — login still succeeds even if email fails

    respond(res).ok('Login successful', {
      accessToken, refreshToken,
      user: { id: user._id, username: user.username, email: user.email,role: user.role, isVerified: user.isVerified },
    });
  } catch (err) { next(err); }
};

// ── POST /api/auth/refresh ───────────────────────────────────────────────────
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) throw new AppError('No refresh token provided', 401);

    const secret  = process.env.REFRESH_SECRET || process.env.JWT_SECRET + '_refresh';
    const decoded = jwt.verify(token, secret);

    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== token)
      throw new AppError('Invalid refresh token', 401);

    const newAccess  = generateAccessToken(user._id);
    const newRefresh = generateRefreshToken(user._id);
    user.refreshToken = newRefresh;
    await user.save();

    respond(res).ok('Token refreshed', { accessToken: newAccess, refreshToken: newRefresh });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError')
      return next(new AppError('Invalid or expired refresh token', 401));
    next(err);
  }
};

// ── POST /api/auth/logout ────────────────────────────────────────────────────
const logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    respond(res).ok('Logged out successfully');
  } catch (err) { next(err); }
};

// ── POST /api/auth/verify-email ──────────────────────────────────────────────
const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user)            throw new AppError('User not found', 404);
    if (user.isVerified)  throw new AppError('Email already verified', 400);
    if (user.verifyToken !== otp) throw new AppError('Invalid verification code', 400);
    if (new Date() > user.verifyTokenExpiry) throw new AppError('Code expired', 400);

    user.isVerified        = true;
    user.verifyToken       = null;
    user.verifyTokenExpiry = null;
    await user.save();

    respond(res).ok('Email verified successfully');
  } catch (err) { next(err); }
};

// ── POST /api/auth/resend-verification ──────────────────────────────────────
const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user)           throw new AppError('User not found', 404);
    if (user.isVerified) throw new AppError('Email already verified', 400);

    const otp = generateOTP();
    user.verifyToken       = otp;
    user.verifyTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    await sendEmail({
      to: email,
      subject: 'New verification code — NeoTravel',
      html: `<h2>New verification code:</h2>
             <h1 style="letter-spacing:8px;color:#C9A84C">${otp}</h1>
             <p>Expires in 24 hours.</p>`,
    }).catch(() => {});

    respond(res).ok('Verification code resent');
  } catch (err) { next(err); }
};

// ── POST /api/auth/forgot-password ──────────────────────────────────────────
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Always 200 — prevent email enumeration
    if (user) {
      const otp = generateOTP();
      user.resetToken       = otp;
      user.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);
      await user.save();

      await sendEmail({
        to: email,
        subject: 'Reset your NeoTravel password',
        html: `<h2>Password Reset</h2>
               <p>Your reset code (valid 15 minutes):</p>
               <h1 style="letter-spacing:8px;color:#C9A84C">${otp}</h1>
               <p>If you didn't request this, ignore this email.</p>`,
      }).catch(() => {});
    }

    respond(res).ok('If that email exists, a reset code was sent');
  } catch (err) { next(err); }
};

// ── POST /api/auth/reset-password ───────────────────────────────────────────
const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.resetToken !== otp)
      throw new AppError('Invalid or expired reset code', 400);
    if (new Date() > user.resetTokenExpiry)
      throw new AppError('Reset code expired', 400);

    user.password         = await bcrypt.hash(newPassword, 10);
    user.resetToken       = null;
    user.resetTokenExpiry = null;
    user.refreshToken     = null;
    await user.save();

    respond(res).ok('Password reset successfully');
  } catch (err) { next(err); }
};

module.exports = {
  signup, login, refreshToken, logout,
  verifyEmail, resendVerification,
  forgotPassword, resetPassword,
};
