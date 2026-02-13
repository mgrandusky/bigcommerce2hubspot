const axios = require('axios');
const { config } = require('../config');
const logger = require('../utils/logger');
const { retryWithBackoff } = require('../utils/retry');

class BigCommerceClient {
  constructor() {
    this.storeHash = config.bigcommerce.storeHash;
    this.accessToken = config.bigcommerce.accessToken;
    this.apiVersion = config.bigcommerce.apiVersion;
    this.baseUrl = `https://api.bigcommerce.com/stores/${this.storeHash}/${this.apiVersion}`;
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'X-Auth-Token': this.accessToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  }

  /**
   * Get order details by order ID
   * @param {Number} orderId - BigCommerce order ID
   * @returns {Promise<Object>} - Order details
   */
  async getOrder(orderId) {
    return retryWithBackoff(
      async () => {
        logger.info(`Fetching order ${orderId} from BigCommerce`);
        const response = await this.client.get(`/orders/${orderId}`);
        return response.data;
      },
      config.retry.maxAttempts,
      config.retry.delayMs,
      `Get order ${orderId}`
    );
  }

  /**
   * Get order products (line items)
   * @param {Number} orderId - BigCommerce order ID
   * @returns {Promise<Array>} - Order products
   */
  async getOrderProducts(orderId) {
    return retryWithBackoff(
      async () => {
        logger.info(`Fetching products for order ${orderId} from BigCommerce`);
        const response = await this.client.get(`/orders/${orderId}/products`);
        return response.data;
      },
      config.retry.maxAttempts,
      config.retry.delayMs,
      `Get order products ${orderId}`
    );
  }

  /**
   * Get customer details by customer ID
   * @param {Number} customerId - BigCommerce customer ID
   * @returns {Promise<Object>} - Customer details
   */
  async getCustomer(customerId) {
    return retryWithBackoff(
      async () => {
        logger.info(`Fetching customer ${customerId} from BigCommerce`);
        const response = await this.client.get(`/customers/${customerId}`);
        return response.data;
      },
      config.retry.maxAttempts,
      config.retry.delayMs,
      `Get customer ${customerId}`
    );
  }

  /**
   * Get cart details by cart ID
   * @param {String} cartId - BigCommerce cart ID
   * @returns {Promise<Object>} - Cart details
   */
  async getCart(cartId) {
    return retryWithBackoff(
      async () => {
        logger.info(`Fetching cart ${cartId} from BigCommerce`);
        const response = await this.client.get(`/carts/${cartId}`);
        return response.data;
      },
      config.retry.maxAttempts,
      config.retry.delayMs,
      `Get cart ${cartId}`
    );
  }

  /**
   * Verify webhook signature
   * @param {String} payload - Raw webhook payload
   * @param {String} signature - Webhook signature from header
   * @returns {Boolean} - Whether signature is valid
   */
  verifyWebhookSignature(payload, signature) {
    const crypto = require('crypto');
    const secret = config.webhook.secret;

    if (!secret) {
      logger.warn('Webhook secret not configured, skipping signature verification');
      return true;
    }

    const hash = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return hash === signature;
  }

  /**
   * Search customers by criteria
   * @param {Object} criteria - Search criteria (email, name, etc.)
   * @returns {Promise<Array>} - Matching customers
   */
  async searchCustomers(criteria) {
    return retryWithBackoff(
      async () => {
        logger.info('Searching customers in BigCommerce', { criteria });
        
        const params = {};
        if (criteria.email) {
          params['email:in'] = criteria.email;
        }
        
        const response = await this.client.get('/customers', { params });
        return response.data;
      },
      config.retry.maxAttempts,
      config.retry.delayMs,
      'Search customers'
    );
  }

  /**
   * Update customer
   * @param {Number} customerId - Customer ID
   * @param {Object} customerData - Customer data to update
   * @returns {Promise<Object>} - Updated customer
   */
  async updateCustomer(customerId, customerData) {
    return retryWithBackoff(
      async () => {
        logger.info(`Updating customer ${customerId} in BigCommerce`);
        const response = await this.client.put(`/customers/${customerId}`, customerData);
        return response.data;
      },
      config.retry.maxAttempts,
      config.retry.delayMs,
      `Update customer ${customerId}`
    );
  }

  /**
   * Update order status
   * @param {Number} orderId - Order ID
   * @param {String} status - New order status
   * @returns {Promise<Object>} - Updated order
   */
  async updateOrderStatus(orderId, status) {
    return retryWithBackoff(
      async () => {
        logger.info(`Updating order ${orderId} status to ${status}`);
        const response = await this.client.put(`/orders/${orderId}`, {
          status_id: this.getStatusId(status),
        });
        return response.data;
      },
      config.retry.maxAttempts,
      config.retry.delayMs,
      `Update order status ${orderId}`
    );
  }

  /**
   * Map status name to status ID
   * @param {String} statusName - Status name
   * @returns {Number} - Status ID
   */
  getStatusId(statusName) {
    return BC_STATUS_MAP[statusName] || 1; // Default to Pending
  }
}

module.exports = BigCommerceClient;
