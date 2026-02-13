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

  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`);
  }
}

module.exports = { config, validateConfig };
