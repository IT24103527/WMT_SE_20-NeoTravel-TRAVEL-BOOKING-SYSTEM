const bcrypt      = require('bcryptjs');
const crypto      = require('crypto');
const User        = require('../models/User.model');
const AppError    = require('../utils/AppError');
const respond     = require('../utils/ApiResponse');
const logActivity = require('../utils/activityLogger');
const cloudinary  = require('../config/cloudinary');

const SAFE_SELECT = '-password -refreshToken -resetToken -verifyToken -verifyTokenExpiry -resetTokenExpiry -twoFactor.secret';

// ── GET /api/users/me ────────────────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select(SAFE_SELECT);
    respond(res).ok('User fetched', user);
  } catch (err) { next(err); }
};

// ── PATCH /api/users/update ──────────────────────────────────────────────────
const updateUser = async (req, res, next) => {
  try {
    const { username, phone, bio } = req.body;
    const user = await User.findById(req.user._id);

    if (username) user.username = username;
    if (phone !== undefined) user.phone = phone;
    if (bio    !== undefined) user.bio   = bio;

    logActivity(user, 'profile_updated', 'Profile info updated', req);
    await user.save();

    const updated = await User.findById(req.user._id).select(SAFE_SELECT);
    respond(res).ok('Profile updated', updated);
  } catch (err) { next(err); }
};

// ── POST /api/users/avatar ───────────────────────────────────────────────────
const uploadAvatar = async (req, res, next) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) throw new AppError('No image data provided', 400);

    // Store as data URI directly in MongoDB (no Cloudinary needed)
    const dataUri = `data:${mimeType || 'image/jpeg'};base64,${imageBase64}`;

    const user = await User.findById(req.user._id);
    user.profileImage = dataUri;
    logActivity(user, 'avatar_updated', 'Profile photo changed', req);
    await user.save();

    respond(res).ok('Avatar uploaded', { profileImage: dataUri });
  } catch (err) { next(err); }
};

// ── DELETE /api/users/avatar ─────────────────────────────────────────────────
const deleteAvatar = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.profileImage = '';
    logActivity(user, 'avatar_removed', 'Profile photo removed', req);
    await user.save();
    respond(res).ok('Avatar removed');
  } catch (err) { next(err); }
};

// ── PATCH /api/users/change-password ────────────────────────────────────────
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new AppError('Current password is incorrect', 400);
    if (currentPassword === newPassword)
      throw new AppError('New password must differ from current', 400);

    user.password     = await bcrypt.hash(newPassword, 10);
    user.refreshToken = null;
    logActivity(user, 'password_changed', 'Password was changed', req);
    await user.save();

    respond(res).ok('Password changed successfully');
  } catch (err) { next(err); }
};

// ── PATCH /api/users/preferences ────────────────────────────────────────────
const updatePreferences = async (req, res, next) => {
  try {
    const { travelStyles, notifications, biometric, currency, language } = req.body;
    const user = await User.findById(req.user._id);

    if (travelStyles  !== undefined) user.preferences.travelStyles  = travelStyles;
    if (notifications !== undefined) user.preferences.notifications = notifications;
    if (biometric     !== undefined) user.preferences.biometric     = biometric;
    if (currency      !== undefined) user.preferences.currency      = currency;
    if (language      !== undefined) user.preferences.language      = language;

    logActivity(user, 'preferences_updated', 'App preferences saved', req);
    await user.save();

    const updated = await User.findById(req.user._id).select(SAFE_SELECT);
    respond(res).ok('Preferences updated', updated);
  } catch (err) { next(err); }
};

// ── PATCH /api/users/privacy ─────────────────────────────────────────────────
const updatePrivacy = async (req, res, next) => {
  try {
    const { profileVisible, showEmail, showPhone, showLastSeen } = req.body;
    const user = await User.findById(req.user._id);

    if (profileVisible !== undefined) user.privacy.profileVisible = profileVisible;
    if (showEmail      !== undefined) user.privacy.showEmail      = showEmail;
    if (showPhone      !== undefined) user.privacy.showPhone      = showPhone;
    if (showLastSeen   !== undefined) user.privacy.showLastSeen   = showLastSeen;

    logActivity(user, 'privacy_updated', 'Privacy settings changed', req);
    await user.save();

    respond(res).ok('Privacy settings updated', user.privacy);
  } catch (err) { next(err); }
};

// ── GET /api/users/login-history ─────────────────────────────────────────────
const getLoginHistory = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('loginHistory');
    respond(res).ok('Login history fetched', user.loginHistory);
  } catch (err) { next(err); }
};

// ── DELETE /api/users/login-history ──────────────────────────────────────────
const clearLoginHistory = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.loginHistory = [];
    logActivity(user, 'login_history_cleared', 'Login history was cleared', req);
    await user.save();
    respond(res).ok('Login history cleared');
  } catch (err) { next(err); }
};

// ── GET /api/users/activity ───────────────────────────────────────────────────
const getActivityLog = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('activityLog');
    respond(res).ok('Activity log fetched', user.activityLog);
  } catch (err) { next(err); }
};

// ── DELETE /api/users/activity ────────────────────────────────────────────────
const clearActivityLog = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { activityLog: [] });
    respond(res).ok('Activity log cleared');
  } catch (err) { next(err); }
};

// ── GET /api/users/sessions ───────────────────────────────────────────────────
const getSessions = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('sessions');
    respond(res).ok('Sessions fetched', user.sessions);
  } catch (err) { next(err); }
};

// ── DELETE /api/users/sessions/:sessionId ────────────────────────────────────
const revokeSession = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.sessions = user.sessions.filter(s => s.sessionId !== req.params.sessionId);
    logActivity(user, 'session_revoked', `Session ${req.params.sessionId} revoked`, req);
    await user.save();
    respond(res).ok('Session revoked');
  } catch (err) { next(err); }
};

// ── DELETE /api/users/sessions ────────────────────────────────────────────────
const revokeAllSessions = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.sessions     = [];
    user.refreshToken = null;
    logActivity(user, 'all_sessions_revoked', 'All sessions signed out', req);
    await user.save();
    respond(res).ok('All sessions revoked');
  } catch (err) { next(err); }
};

// ── GET /api/users/export ─────────────────────────────────────────────────────
const exportAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -refreshToken -resetToken -verifyToken -twoFactor.secret');

    const exportData = {
      exportedAt: new Date().toISOString(),
      profile: {
        username:     user.username,
        email:        user.email,
        phone:        user.phone,
        bio:          user.bio,
        profileImage: user.profileImage,
        isVerified:   user.isVerified,
        isActive:     user.isActive,
        memberSince:  user.createdAt,
        lastSeen:     user.lastSeen,
      },
      preferences:  user.preferences,
      privacy:      user.privacy,
      loginHistory: user.loginHistory,
      activityLog:  user.activityLog,
    };

    logActivity(user, 'data_exported', 'Account data was exported', req);
    await user.save();

    respond(res).ok('Account data exported', exportData);
  } catch (err) { next(err); }
};

// ── PATCH /api/users/deactivate ───────────────────────────────────────────────
const deactivateAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.isActive     = false;
    user.refreshToken = null;
    logActivity(user, 'account_deactivated', 'Account was deactivated', req);
    await user.save();
    respond(res).ok('Account deactivated');
  } catch (err) { next(err); }
};

// ── DELETE /api/users/delete ──────────────────────────────────────────────────
const deleteUser = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    respond(res).ok('Account deleted successfully');
  } catch (err) { next(err); }
};

module.exports = {
  getMe, updateUser, uploadAvatar, deleteAvatar,
  changePassword, updatePreferences, updatePrivacy,
  getLoginHistory, clearLoginHistory,
  getActivityLog, clearActivityLog,
  getSessions, revokeSession, revokeAllSessions,
  exportAccount, deactivateAccount, deleteUser,
};
