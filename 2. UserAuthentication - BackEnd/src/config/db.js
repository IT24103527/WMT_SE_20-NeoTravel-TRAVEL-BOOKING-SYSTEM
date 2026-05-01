const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    console.log('Retrying in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

module.exports = connectDB;
