const express = require('express');
const authRoutes = require('./routes/auth');
const syncLogsRoutes = require('./routes/syncLogs');

const router = express.Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/sync-logs', syncLogsRoutes);

// Health check for admin API
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'admin-api' });
});

module.exports = router;
