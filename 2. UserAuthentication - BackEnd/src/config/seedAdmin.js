// src/config/seedAdmin.js
const User = require('../models/User.model');
const bcrypt = require('bcryptjs');

const seedAdmin = async () => {
  try {
    const adminEmail = 'admin@gmail.com';

    const existing = await User.findOne({ email: adminEmail });

    if (existing) {
      console.log('Admin already exists');
      return;
    }

    const hashedPassword = await bcrypt.hash('Admin123@', 10);

    await User.create({
      username: 'Admin',
      email: adminEmail,
      password: hashedPassword,
      role: 'admin'
    });

    console.log('Admin created: admin@gmail.com / Admin123');
  } catch (err) {
    console.error('Admin seed error', err);
  }
};

module.exports = seedAdmin;