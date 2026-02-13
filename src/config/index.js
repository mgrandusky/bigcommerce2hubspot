require('dotenv').config();

const config = {
  // Server configuration
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // BigCommerce configuration
  bigcommerce: {
    storeHash: process.env.BIGCOMMERCE_STORE_HASH,
    accessToken: process.env.BIGCOMMERCE_ACCESS_TOKEN,
    clientId: process.env.BIGCOMMERCE_CLIENT_ID,
    clientSecret: process.env.BIGCOMMERCE_CLIENT_SECRET,
    apiVersion: 'v3',
  },

  // HubSpot configuration
  hubspot: {
    apiKey: process.env.HUBSPOT_API_KEY,
    accessToken: process.env.HUBSPOT_ACCESS_TOKEN,
    pipelineId: process.env.HUBSPOT_PIPELINE_ID || 'default',
    orderStageId: process.env.HUBSPOT_ORDER_STAGE_ID || 'closedwon',
    abandonedCartStageId: process.env.HUBSPOT_ABANDONED_CART_STAGE_ID || 'appointmentscheduled',
  },

  // Webhook configuration
  webhook: {
    secret: process.env.WEBHOOK_SECRET,
  },

  // Retry configuration
  retry: {
    maxAttempts: parseInt(process.env.MAX_RETRY_ATTEMPTS) || 3,
    delayMs: parseInt(process.env.RETRY_DELAY_MS) || 1000,
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },

  // Database configuration
  database: {
    dialect: process.env.DB_DIALECT || 'sqlite',
    storage: process.env.DB_STORAGE || './data/database.sqlite',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    logging: process.env.DB_LOGGING === 'true',
  },

  // Queue configuration (Redis)
  queue: {
    enabled: process.env.QUEUE_ENABLED === 'true',
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB) || 0,
    },
  },

  // Cache configuration
  cache: {
    enabled: process.env.CACHE_ENABLED === 'true',
    ttl: parseInt(process.env.CACHE_TTL) || 3600, // seconds
  },

  // Admin interface configuration
  admin: {
    enabled: process.env.ADMIN_ENABLED !== 'false',
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
};

// Validate required configuration
function validateConfig() {
  const required = {
    'BigCommerce Store Hash': config.bigcommerce.storeHash,
    'BigCommerce Access Token': config.bigcommerce.accessToken,
  };

  // At least one HubSpot authentication method is required
  if (!config.hubspot.apiKey && !config.hubspot.accessToken) {
    required['HubSpot API Key or Access Token'] = null;
  }

  // JWT secret is required if admin is enabled
  if (config.admin.enabled && !config.admin.jwtSecret) {
    required['JWT_SECRET (for admin API)'] = null;
  }

  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`);
  }

  // Warn about insecure configurations
  if (config.nodeEnv === 'production') {
    if (config.admin.enabled && config.admin.jwtSecret && config.admin.jwtSecret.length < 32) {
      logger.warn('JWT secret is too short for production. Use at least 32 characters.');
    }
  }
}

module.exports = { config, validateConfig };
