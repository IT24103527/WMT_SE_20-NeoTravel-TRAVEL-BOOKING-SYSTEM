// src/api/package.api.js
import axiosInstance from './axiosInstance';

export const getAllPackages = () => axiosInstance.get('/packages');
export const getPackageById = (id) => axiosInstance.get(`/packages/${id}`);
export const createPackage = (data) => axiosInstance.post('/packages', data);
export const updatePackage = (id, data) => axiosInstance.patch(`/packages/${id}`, data);
export const deletePackage = (id) => axiosInstance.delete(`/packages/${id}`);