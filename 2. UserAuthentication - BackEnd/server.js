const dotenv  = require('dotenv');
dotenv.config(); // MUST be first before any process.env usage

// Force Google DNS — bypasses system DNS that blocks Atlas SRV lookups
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const connectDB = require('./src/config/db');
const { apiLimiter } = require('./src/middleware/rateLimit.middleware');

const authRoutes      = require('./src/routes/auth.routes');
const userRoutes      = require('./src/routes/user.routes');
const errorMiddleware = require('./src/middleware/error.middleware');

connectDB();

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

app.use('/api/auth',  authRoutes);
app.use('/api/users', userRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

module.exports = app;
