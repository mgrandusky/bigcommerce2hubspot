const SyncService = require('../services/sync');
const logger = require('../utils/logger');

const syncService = new SyncService();

// Initialize the sync service
syncService.initialize().catch((error) => {
  logger.error('Failed to initialize sync service', { error: error.message });
});

/**
 * Handle order created webhook
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function handleOrderCreated(req, res) {
  try {
    const webhookData = req.body;
    logger.info('Received order created webhook', { webhookData });

    // Extract order ID from webhook data
    const orderId = webhookData.data?.id || webhookData.order_id;

    if (!orderId) {
      logger.error('No order ID in webhook payload');
      return res.status(400).json({ error: 'No order ID provided' });
    }

    // Acknowledge webhook immediately
    res.status(200).json({ received: true });

    // Process order asynchronously
    try {
      await syncService.syncOrder(orderId);
      logger.info(`Order ${orderId} processed successfully`);
    } catch (error) {
      logger.error(`Failed to process order ${orderId}`, {
        error: error.message,
        stack: error.stack,
      });
    }
  } catch (error) {
    logger.error('Error handling order created webhook', {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Handle cart abandoned webhook
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function handleCartAbandoned(req, res) {
  try {
    const webhookData = req.body;
    logger.info('Received cart abandoned webhook', { webhookData });

    // Extract cart ID from webhook data
    const cartId = webhookData.data?.id || webhookData.cart_id;

    if (!cartId) {
      logger.error('No cart ID in webhook payload');
      return res.status(400).json({ error: 'No cart ID provided' });
    }

    // Acknowledge webhook immediately
    res.status(200).json({ received: true });

    // Process cart asynchronously
    try {
      await syncService.syncAbandonedCart(cartId);
      logger.info(`Abandoned cart ${cartId} processed successfully`);
    } catch (error) {
      logger.error(`Failed to process abandoned cart ${cartId}`, {
        error: error.message,
        stack: error.stack,
      });
    }
  } catch (error) {
    logger.error('Error handling cart abandoned webhook', {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Generic webhook handler that routes to specific handlers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function handleWebhook(req, res) {
  try {
    const webhookData = req.body;
    const scope = webhookData.scope;

    logger.info('Received webhook', { scope });

    switch (scope) {
      case 'store/order/created':
        return handleOrderCreated(req, res);
      case 'store/cart/abandoned':
        return handleCartAbandoned(req, res);
      default:
        logger.warn(`Unhandled webhook scope: ${scope}`);
        return res.status(200).json({ received: true, message: 'Scope not handled' });
    }
  } catch (error) {
    logger.error('Error handling webhook', {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  handleWebhook,
  handleOrderCreated,
  handleCartAbandoned,
};
