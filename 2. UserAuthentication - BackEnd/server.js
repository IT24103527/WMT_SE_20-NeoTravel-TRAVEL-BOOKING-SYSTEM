const dotenv  = require('dotenv');
dotenv.config(); // MUST be first before any process.env usage

// Force Google DNS — bypasses system DNS that blocks Atlas SRV lookups
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const path = require('path');
const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const connectDB = require('./src/config/db');
const { apiLimiter } = require('./src/middleware/rateLimit.middleware');

const authRoutes      = require('./src/routes/auth.routes');
const imageRoutes     = require('./src/routes/imageRoutes');
const bookingRoutes   = require('./src/routes/booking.routes');
const reviewRoutes    = require('./src/routes/review.routes');

const userRoutes      = require('./src/routes/user.routes');

const errorMiddleware = require('./src/middleware/error.middleware');

//packages
const packageRoutes   = require('./src/routes/package.routes');

//favorites
const favoriteRoutes  = require('./src/routes/favorite.routes');

//admin seed
const seedAdmin = require("./src/config/seedAdmin");

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '5mb' }));
app.use('/api', apiLimiter);

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', env: process.env.NODE_ENV, timestamp: new Date().toISOString() });
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/auth',  authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/reviews', reviewRoutes);

//booking and packages
app.use('/api/bookings', bookingRoutes);
app.use('/api/packages', packageRoutes);

//favorites
app.use('/api/favorites', favoriteRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use(errorMiddleware);

async function start() 
{
      await connectDB();
      await seedAdmin();

    const PORT = process.env.PORT || 5000;
    app.listen(PORT,"0.0.0.0",() => {
      console.log(`Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

}

if (require.main === module) {
  start();
}

module.exports = app;
