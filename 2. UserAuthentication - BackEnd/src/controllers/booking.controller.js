const Booking = require('../models/Booking');
const Package = require('../models/Package');
const AppError = require('../utils/AppError');

exports.createBooking = async (req, res, next) => {
  try {
    const { packageId, bookingDate, travelers } = req.body;

    if (!packageId || !bookingDate) {
      return next(new AppError('packageId and bookingDate are required', 400));
    }

    const pkg = await Package.findById(packageId);
    if (!pkg) {
      return next(new AppError('Package not found', 404));
    }

    const booking = await Booking.create({
      userId: req.user._id,
      packageId,
      bookingDate,
      travelers: travelers || 1,
    });

    res.status(201).json({ success: true, booking });
  } catch (error) {
    next(error);
  }
};

exports.getBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id })
      .populate('packageId', 'title description destination duration price image')
      .sort({ createdAt: -1 })
      .lean();

    // Transform packageId to package for consistency
    const transformedBookings = bookings.map(booking => ({
      ...booking,
      package: booking.packageId,
      packageId: undefined,
    }));

    res.json({ success: true, bookings: transformedBookings });
  } catch (error) {
    next(error);
  }
};

exports.getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, userId: req.user._id })
      .populate('packageId', 'title description destination duration price image');

    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }

    const transformedBooking = {
      ...booking.toObject(),
      package: booking.packageId,
      packageId: undefined,
    };

    res.json({ success: true, booking: transformedBooking });
  } catch (error) {
    next(error);
  }
};
