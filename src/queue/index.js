const Bull = require('bull');
const { config } = require('../config');
const logger = require('../utils/logger');

let queues = {};
let isInitialized = false;

function initializeQueues() {
  if (!config.queue.enabled) {
    logger.info('Queue system disabled');
    return null;
  }

  if (isInitialized) {
    return queues;
  }

  try {
    const redisConfig = {
      redis: {
        host: config.queue.redis.host,
        port: config.queue.redis.port,
        password: config.queue.redis.password,
        db: config.queue.redis.db,
      },
    };

    queues.orderSync = new Bull('order-sync', redisConfig);
    queues.cartSync = new Bull('cart-sync', redisConfig);

    isInitialized = true;
    logger.info('Queue system initialized successfully');
    return queues;
  } catch (error) {
    logger.error('Failed to initialize queue system', { error: error.message });
    return null;
  }
}

async function queueOrderSync(orderId) {
  if (!queues.orderSync) {
    logger.warn('Queue not initialized');
    return null;
  }

  const job = await queues.orderSync.add({ orderId });
  logger.info(`Queued order sync for order ${orderId}`, { jobId: job.id });
  return { jobId: job.id };
}

async function closeQueues() {
  if (!queues) return;

  for (const [name, queue] of Object.entries(queues)) {
    try {
      await queue.close();
      logger.info(`Closed queue: ${name}`);
    } catch (error) {
      logger.error(`Error closing queue ${name}`, { error: error.message });
    }
  }

  isInitialized = false;
  queues = {};
}

module.exports = {
  initializeQueues,
  queueOrderSync,
  closeQueues,
};
