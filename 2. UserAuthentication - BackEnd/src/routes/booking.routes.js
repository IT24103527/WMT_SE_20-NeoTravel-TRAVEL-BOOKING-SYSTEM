const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth.middleware');
const {
  createBooking,
  getBookings,
  getBooking,
} = require('../controllers/booking.controller');

router.post('/', auth, createBooking);
router.get('/', auth, getBookings);
router.get('/:id', auth, getBooking);

module.exports = router;
