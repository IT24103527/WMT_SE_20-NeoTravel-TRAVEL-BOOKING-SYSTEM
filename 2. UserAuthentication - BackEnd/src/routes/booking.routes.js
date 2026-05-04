const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const admin = require('../middleware/admin.middleware');
const { processPayment } = require('../controllers/booking.controller');


const {
  createBooking,
  getMyBookings,
  getAllBookings,
  cancelBooking,
  deleteBooking
} = require('../controllers/booking.controller');

router.post('/', auth, createBooking);
router.get('/me', auth, getMyBookings);
router.get('/', auth, admin, getAllBookings);
router.patch('/:id/cancel', auth, cancelBooking); 
router.patch('/:id/pay', auth, processPayment);
router.delete('/:id', auth, deleteBooking);

module.exports = router;