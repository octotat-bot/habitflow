require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// ── Fail-fast: validate required env vars ─────────────────
const REQUIRED_ENV = ['JWT_SECRET', 'MONGODB_URI'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length > 0) {
  console.error(`❌ Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}
if (process.env.JWT_SECRET === 'habitflow_super_secret_jwt_key_change_in_production') {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Default JWT_SECRET must be changed in production!');
    process.exit(1);
  } else {
    console.warn('⚠️  Using default JWT_SECRET — change this before deploying');
  }
}

const authRoutes        = require('./routes/auth');
const habitRoutes       = require('./routes/habits');
const completionRoutes  = require('./routes/completions');
const analyticsRoutes   = require('./routes/analytics');
const streakRoutes      = require('./routes/streaks');
const achievementRoutes = require('./routes/achievements');
const profileRoutes     = require('./routes/profile');
const aiRoutes          = require('./routes/ai');

const app = express();

// ── CORS — support comma-separated list for multiple origins ──
const rawOrigins = process.env.CLIENT_URL || 'http://localhost:5173';
const allowedOrigins = rawOrigins.split(',').map(o => o.trim());

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, mobile apps, SSR)
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// ── Security headers ──────────────────────────────────────
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Rate limiting ─────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'Too many attempts. Please try again in 15 minutes.' },
  standardHeaders: true, legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
});
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: 'Too many requests. Please slow down.' },
  standardHeaders: true, legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
});
app.use('/api/auth', authLimiter);
app.use('/api/', apiLimiter);

// ── Routes ────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/habits',       habitRoutes);
app.use('/api/completions',  completionRoutes);
app.use('/api/analytics',    analyticsRoutes);
app.use('/api/streaks',      streakRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/profile',      profileRoutes);
app.use('/api/ai',           aiRoutes);

// ── Health check ──────────────────────────────────────────
app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', timestamp: new Date(), env: process.env.NODE_ENV })
);

// ── Root route ────────────────────────────────────────────
app.get('/', (req, res) =>
  res.send('HabitFlow API is running successfully.')
);

// ── 404 handler ───────────────────────────────────────────
app.use('/api/*', (req, res) =>
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` })
);

// ── Global error handler ──────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.message?.startsWith('CORS:')) {
    return res.status(403).json({ error: err.message });
  }
  const status = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? (status < 500 ? err.message : 'Internal Server Error')
    : err.message;
  console.error(`[${status}] ${req.method} ${req.path}:`, err.message);
  res.status(status).json({ error: message });
});

// ── Connect to MongoDB & start server ─────────────────────
const PORT = process.env.PORT || 5001;

mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
})
  .then(() => {
    console.log('✅ MongoDB connected');
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    });

    // Graceful shutdown
    const shutdown = (signal) => {
      console.log(`\n${signal} received — shutting down gracefully`);
      server.close(() => {
        mongoose.connection.close(false).then(() => {
          console.log('MongoDB connection closed');
          process.exit(0);
        });
      });
      setTimeout(() => { console.error('Forced shutdown'); process.exit(1); }, 10000);
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

module.exports = app;
