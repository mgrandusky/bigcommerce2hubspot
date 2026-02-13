const express = require('express');
const rateLimit = require('express-rate-limit');
const { config, validateConfig } = require('./config');
const { handleWebhook } = require('./handlers/webhook');
const logger = require('./utils/logger');
const BigCommerceClient = require('./clients/bigcommerce');
const { initializeDatabase, closeDatabase } = require('./database');
const { initializeQueues, closeQueues } = require('./queue');
const adminApi = require('./admin');

// Validate configuration on startup
try {
  validateConfig();
  logger.info('Configuration validated successfully');
} catch (error) {
  logger.error('Configuration validation failed', { error: error.message });
  process.exit(1);
}

// Initialize database
initializeDatabase()
  .then(() => {
    logger.info('Database initialized successfully');
  })
  .catch((error) => {
    logger.warn('Database initialization failed, continuing without database', {
      error: error.message,
    });
  });

// Initialize queue system
initializeQueues();

const app = express();

// Rate limiting for webhook endpoint
const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      url: req.url,
    });
    res.status(429).json({
      error: 'Too many requests, please try again later.',
    });
  },
});

// Middleware for webhook signature verification
const bigcommerceClient = new BigCommerceClient();

app.use('/webhook', webhookLimiter, express.raw({ type: 'application/json' }), (req, res, next) => {
  const signature = req.headers['x-bc-webhook-signature'];
  const payload = req.body.toString('utf8');

  if (!bigcommerceClient.verifyWebhookSignature(payload, signature)) {
    logger.warn('Invalid webhook signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Parse the body for downstream handlers
  req.body = JSON.parse(payload);
  next();
});

// Regular JSON middleware for other routes
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Admin API routes
if (config.admin.enabled) {
  app.use('/admin', adminApi);
  logger.info('Admin API enabled at /admin');
}

// Webhook endpoint
app.post('/webhook', handleWebhook);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handling middleware (must be after all other middleware and routes)
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = config.port;
const server = app.listen(PORT, () => {
  logger.info(`BigCommerce to HubSpot integration server started on port ${PORT}`);
  logger.info('Webhook endpoint available at: /webhook');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(async () => {
    await closeQueues();
    await closeDatabase();
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(async () => {
    await closeQueues();
    await closeDatabase();
    logger.info('Server closed');
    process.exit(0);
  });
});

module.exports = app;
