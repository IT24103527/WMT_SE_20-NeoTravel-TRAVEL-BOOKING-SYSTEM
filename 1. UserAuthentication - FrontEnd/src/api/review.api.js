import axiosInstance from './axiosInstance';

export const getPackageReviews = (packageId) => axiosInstance.get(`/reviews/package/${packageId}`);
export const createReview = (data) => axiosInstance.post('/reviews', data);
export const updateReview = (id, data) => axiosInstance.patch(`/reviews/${id}`, data);
export const deleteReview = (id) => axiosInstance.delete(`/reviews/${id}`);