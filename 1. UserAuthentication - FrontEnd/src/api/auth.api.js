import axiosInstance from './axiosInstance';

// ── Auth ─────────────────────────────────────────────────────────────────────
export const signup             = (data) => axiosInstance.post('/auth/signup', data);
export const login              = (data) => axiosInstance.post('/auth/login', data);
export const refreshTokenApi    = (data) => axiosInstance.post('/auth/refresh', data);
export const logoutApi          = ()     => axiosInstance.post('/auth/logout');
export const verifyEmail        = (data) => axiosInstance.post('/auth/verify-email', data);
export const resendVerification = (data) => axiosInstance.post('/auth/resend-verification', data);
export const forgotPassword     = (data) => axiosInstance.post('/auth/forgot-password', data);
export const resetPassword      = (data) => axiosInstance.post('/auth/reset-password', data);

// ── Profile ───────────────────────────────────────────────────────────────────
export const getMe             = ()       => axiosInstance.get('/users/me');
export const updateUser        = (data)   => axiosInstance.patch('/users/update', data);
export const uploadAvatar      = (data)   => axiosInstance.post('/users/avatar', data);
export const deleteAvatar      = ()       => axiosInstance.delete('/users/avatar');

// ── Security ──────────────────────────────────────────────────────────────────
export const changePassword    = (data)   => axiosInstance.patch('/users/change-password', data);

// ── Preferences & Privacy ─────────────────────────────────────────────────────
export const updatePreferences = (data)   => axiosInstance.patch('/users/preferences', data);
export const updatePrivacy     = (data)   => axiosInstance.patch('/users/privacy', data);

// ── Login History ─────────────────────────────────────────────────────────────
export const getLoginHistory   = ()       => axiosInstance.get('/users/login-history');
export const clearLoginHistory = ()       => axiosInstance.delete('/users/login-history');

// ── Activity Log ──────────────────────────────────────────────────────────────
export const getActivityLog    = ()       => axiosInstance.get('/users/activity');
export const clearActivityLog  = ()       => axiosInstance.delete('/users/activity');

// ── Sessions ──────────────────────────────────────────────────────────────────
export const getSessions       = ()       => axiosInstance.get('/users/sessions');
export const revokeSession     = (id)     => axiosInstance.delete(`/users/sessions/${id}`);
export const revokeAllSessions = ()       => axiosInstance.delete('/users/sessions');

// ── Data Export ───────────────────────────────────────────────────────────────
export const exportAccount     = ()       => axiosInstance.get('/users/export');

// ── Account ───────────────────────────────────────────────────────────────────
export const deactivateAccount = ()       => axiosInstance.patch('/users/deactivate');
export const deleteUser        = ()       => axiosInstance.delete('/users/delete');
