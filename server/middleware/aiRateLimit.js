const rateLimit = require('express-rate-limit');

// 20 AI requests per user per hour (keyed by JWT userId via header or IP fallback)
const aiRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.userId || req.ip,
  message: { error: 'AI rate limit reached. You can make 20 AI requests per hour.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test',
});

module.exports = aiRateLimit;
