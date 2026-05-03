// src/api/favorite.api.js
import axiosInstance from './axiosInstance';

/** Toggle favorite (add if not exists, remove if already favorited) */
export const toggleFavorite = (packageId) =>
  axiosInstance.post('/favorites', { packageId });

/** Get all favorited packages for the logged-in user */
export const getMyFavorites = () =>
  axiosInstance.get('/favorites');

/**
 * Update notes and/or priority of an existing favorite.
 * @param {string} packageId
 * @param {{ notes?: string, priority?: 'low'|'medium'|'high' }} data
 */
export const updateFavorite = (packageId, data) =>
  axiosInstance.patch(`/favorites/${packageId}`, data);

/** Explicitly remove a package from favorites */
export const removeFavorite = (packageId) =>
  axiosInstance.delete(`/favorites/${packageId}`);

/** Check if a specific package is favorited */
export const checkFavorite = (packageId) =>
  axiosInstance.get(`/favorites/check/${packageId}`);
