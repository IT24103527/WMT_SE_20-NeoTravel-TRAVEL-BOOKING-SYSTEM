// src/controllers/booking.controller.js
const Booking = require('../models/Booking');
const Package = require('../models/Package');
const AppError = require('../utils/AppError');

// Create booking (User)
exports.createBooking = async (req, res, next) => {
  try {
    const { packageId, bookingDate, travelers = 1 } = req.body;

    const pkg = await Package.findById(packageId);
    if (!pkg) throw new AppError('Package not found', 404);

    const totalPrice = pkg.price * travelers;

    const booking = await Booking.create({
      user: req.user._id,
      package: packageId,
      bookingDate,
      travelers,
      totalPrice,
      status: 'pending',
      paymentStatus: 'pending'
    });

    await booking.populate('package');

    res.status(201).json({
      success: true,
      data: booking
    });
  } catch (err) {
    next(err);
  }
};

// Get my bookings
exports.getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('package', 'title description price image')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: bookings
    });
  } catch (err) {
    next(err);
  }
};

// Admin: Get all bookings
exports.getAllBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find()
      .populate('user', 'username email')
      .populate('package', 'title price')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: bookings
    });
  } catch (err) {
    next(err);
  }
};

// Optional: Cancel booking (user)
exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!booking) throw new AppError('Booking not found', 404);
    if (booking.status === 'cancelled') throw new AppError('Already cancelled', 400);

    booking.status = 'cancelled';
    await booking.save();

    res.json({ success: true, message: 'Booking cancelled' });
  } catch (err) {
    next(err);
  }
};