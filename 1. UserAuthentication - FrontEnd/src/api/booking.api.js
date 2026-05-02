import axiosInstance from './axiosInstance';

export const createBooking = (data) => axiosInstance.post('/bookings', data);
export const getBookings = () => axiosInstance.get('/bookings');
export const getBookingById = (id) => axiosInstance.get(`/bookings/${id}`);
export const deleteBooking = (id) => axiosInstance.delete(`/bookings/${id}`);
