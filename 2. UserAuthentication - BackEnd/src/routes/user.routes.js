const express  = require('express');
const {
  getMe, updateUser, uploadAvatar, deleteAvatar,
  changePassword, updatePreferences, updatePrivacy,
  getLoginHistory, clearLoginHistory,
  getActivityLog, clearActivityLog,
  getSessions, revokeSession, revokeAllSessions,
  exportAccount, deactivateAccount, deleteUser,
} = require('../controllers/user.controller');
const protectRoute = require('../middleware/auth.middleware');
const validate     = require('../middleware/validate.middleware');
const upload       = require('../middleware/upload.middleware');

const router = express.Router();
router.use(protectRoute);

// Profile
router.get('/me',                  getMe);
router.patch('/update',            updateUser);
router.post('/avatar',             uploadAvatar);
router.delete('/avatar',           deleteAvatar);

// Security
router.patch('/change-password',   validate(['currentPassword', 'newPassword']), changePassword);

// Preferences & Privacy
router.patch('/preferences',       updatePreferences);
router.patch('/privacy',           updatePrivacy);

// Login History
router.get('/login-history',       getLoginHistory);
router.delete('/login-history',    clearLoginHistory);

// Activity Log
router.get('/activity',            getActivityLog);
router.delete('/activity',         clearActivityLog);

// Sessions
router.get('/sessions',            getSessions);
router.delete('/sessions',         revokeAllSessions);
router.delete('/sessions/:sessionId', revokeSession);

// Data Export
router.get('/export',              exportAccount);

// Account
router.patch('/deactivate',        deactivateAccount);
router.delete('/delete',           deleteUser);

module.exports = router;
