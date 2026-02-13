const express = require('express');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');
const syncLogsRoutes = require('./routes/syncLogs');

const router = express.Router();

// Rate limiting for admin API
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all admin routes
router.use(adminLimiter);

// Mount routes
router.use('/auth', authRoutes);
router.use('/sync-logs', syncLogsRoutes);

// Health check for admin API
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'admin-api' });
});

module.exports = router;
