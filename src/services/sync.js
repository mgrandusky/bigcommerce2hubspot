const BigCommerceClient = require('../clients/bigcommerce');
const HubSpotClient = require('../clients/hubspot');
const { mapCustomerToContact, mapOrderToDeal, mapCartToDeal } = require('./mapper');
const logger = require('../utils/logger');
const syncLogService = require('./syncLog');

class SyncService {
  constructor() {
    this.bigcommerceClient = new BigCommerceClient();
    this.hubspotClient = new HubSpotClient();
  }

  /**
   * Initialize sync service
   */
  async initialize() {
    await syncLogService.initialize();
    logger.info('SyncService initialized');
  }

  /**
   * Sync a completed order from BigCommerce to HubSpot
   * @param {Number} orderId - BigCommerce order ID
   * @returns {Promise<Object>} - Sync result
   */
  async syncOrder(orderId) {
    let syncLog = null;
    try {
      logger.info(`Starting order sync for order ${orderId}`);

      // Create sync log
      syncLog = await syncLogService.createLog({
        syncType: 'order',
        direction: 'bc_to_hs',
        entityType: 'order',
        entityId: orderId.toString(),
      });

      // Fetch order details from BigCommerce
      const order = await this.bigcommerceClient.getOrder(orderId);
      const products = await this.bigcommerceClient.getOrderProducts(orderId);

      // Extract customer information
      let customer = {};
      if (order.customer_id && order.customer_id > 0) {
        try {
          customer = await this.bigcommerceClient.getCustomer(order.customer_id);
        } catch (error) {
          logger.warn(`Could not fetch customer ${order.customer_id}`, { error: error.message });
        }
      }

      // Map customer to HubSpot contact
      const contactData = mapCustomerToContact(customer, order.billing_address);
      
      if (!contactData.email) {
        throw new Error('No email found for customer');
      }

      // Create or update contact in HubSpot
      const contact = await this.hubspotClient.createOrUpdateContact(contactData);
      const contactId = contact.vid;

      // Map order to HubSpot deal
      const dealData = mapOrderToDeal(order, products);

      // Create deal in HubSpot
      const deal = await this.hubspotClient.createDeal(dealData);
      const dealId = deal.dealId;

      // Associate deal with contact
      await this.hubspotClient.associateDealWithContact(dealId, contactId);

      logger.info(`Successfully synced order ${orderId}`, {
        orderId,
        contactId,
        dealId,
      });

      // Log success
      if (syncLog) {
        await syncLogService.logSuccess(syncLog.id, { contactId, dealId });
      }

      return {
        success: true,
        orderId,
        contactId,
        dealId,
      };
    } catch (error) {
      logger.error(`Failed to sync order ${orderId}`, {
        error: error.message,
        stack: error.stack,
      });

      // Log failure
      if (syncLog) {
        await syncLogService.logFailure(syncLog.id, error);
      }

      throw error;
    }
  }

  /**
   * Sync an abandoned cart from BigCommerce to HubSpot
   * @param {String} cartId - BigCommerce cart ID
   * @returns {Promise<Object>} - Sync result
   */
  async syncAbandonedCart(cartId) {
    let syncLog = null;
    try {
      logger.info(`Starting abandoned cart sync for cart ${cartId}`);

      // Create sync log
      syncLog = await syncLogService.createLog({
        syncType: 'abandoned_cart',
        direction: 'bc_to_hs',
        entityType: 'cart',
        entityId: cartId.toString(),
      });

      // Fetch cart details from BigCommerce
      const cart = await this.bigcommerceClient.getCart(cartId);

      // Extract customer information from cart
      const customer = cart.customer || {};
      const billingAddress = cart.billing_address || {};

      // Map customer to HubSpot contact
      const contactData = mapCustomerToContact(customer, billingAddress);
      
      // For abandoned carts, email might be in cart.email
      if (!contactData.email && cart.email) {
        contactData.email = cart.email;
      }

      if (!contactData.email) {
        logger.warn(`No email found for abandoned cart ${cartId}`);
        throw new Error('No email found for customer');
      }

      // Create or update contact in HubSpot
      const contact = await this.hubspotClient.createOrUpdateContact(contactData);
      const contactId = contact.vid;

      // Map cart to HubSpot deal
      const dealData = mapCartToDeal(cart);

      // Create deal in HubSpot
      const deal = await this.hubspotClient.createDeal(dealData);
      const dealId = deal.dealId;

      // Associate deal with contact
      await this.hubspotClient.associateDealWithContact(dealId, contactId);

      logger.info(`Successfully synced abandoned cart ${cartId}`, {
        cartId,
        contactId,
        dealId,
      });

      // Log success
      if (syncLog) {
        await syncLogService.logSuccess(syncLog.id, { contactId, dealId });
      }

      return {
        success: true,
        cartId,
        contactId,
        dealId,
      };
    } catch (error) {
      logger.error(`Failed to sync abandoned cart ${cartId}`, {
        error: error.message,
        stack: error.stack,
      });

      // Log failure
      if (syncLog) {
        await syncLogService.logFailure(syncLog.id, error);
      }

      throw error;
    }
  }
}

module.exports = SyncService;
