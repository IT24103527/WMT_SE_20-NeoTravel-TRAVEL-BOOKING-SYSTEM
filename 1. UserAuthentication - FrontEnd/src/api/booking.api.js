// src/api/booking.api.js
import axiosInstance from './axiosInstance';

export const createBooking = (data) => axiosInstance.post('/bookings', data);
export const getMyBookings = () => axiosInstance.get('/bookings/me');
export const getAllBookings = () => axiosInstance.get('/bookings'); // admin only
export const cancelBooking = (id) => axiosInstance.patch(`/bookings/${id}/cancel`);