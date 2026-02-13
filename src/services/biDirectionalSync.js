const BigCommerceClient = require('../clients/bigcommerce');
const HubSpotClient = require('../clients/hubspot');
const logger = require('../utils/logger');
const syncLogService = require('./syncLog');

/**
 * Service for bi-directional synchronization
 * Handles syncing data from HubSpot back to BigCommerce
 */
class BiDirectionalSyncService {
  constructor() {
    this.bigcommerceClient = new BigCommerceClient();
    this.hubspotClient = new HubSpotClient();
  }

  /**
   * Sync HubSpot contact updates back to BigCommerce customer
   */
  async syncContactToCustomer(contactId) {
    let syncLog = null;
    try {
      logger.info(`Starting contact to customer sync for contact ${contactId}`);

      syncLog = await syncLogService.createLog({
        syncType: 'contact_to_customer',
        direction: 'hs_to_bc',
        entityType: 'contact',
        entityId: contactId.toString(),
      });

      // Get contact from HubSpot
      const contact = await this.hubspotClient.getContact(contactId);
      
      // Map contact data to BigCommerce customer format
      const customerData = this.mapContactToCustomer(contact);

      // Find customer by email in BigCommerce
      const customers = await this.bigcommerceClient.searchCustomers({
        email: customerData.email,
      });

      if (customers && customers.length > 0) {
        // Update existing customer
        const customerId = customers[0].id;
        await this.bigcommerceClient.updateCustomer(customerId, customerData);
        logger.info(`Updated BigCommerce customer ${customerId}`);

        if (syncLog) {
          await syncLogService.logSuccess(syncLog.id, { customerId });
        }

        return { success: true, customerId };
      } else {
        logger.warn(`No BigCommerce customer found for contact ${contactId}`);
        
        if (syncLog) {
          await syncLogService.logSuccess(syncLog.id, {
            message: 'No matching customer found',
          });
        }

        return { success: true, message: 'No matching customer found' };
      }
    } catch (error) {
      logger.error(`Failed to sync contact ${contactId} to customer`, {
        error: error.message,
      });

      if (syncLog) {
        await syncLogService.logFailure(syncLog.id, error);
      }

      throw error;
    }
  }

  /**
   * Update BigCommerce order status based on HubSpot deal stage
   */
  async syncDealToOrderStatus(dealId) {
    let syncLog = null;
    try {
      logger.info(`Starting deal to order status sync for deal ${dealId}`);

      syncLog = await syncLogService.createLog({
        syncType: 'deal_to_order',
        direction: 'hs_to_bc',
        entityType: 'deal',
        entityId: dealId.toString(),
      });

      // Get deal from HubSpot
      const deal = await this.hubspotClient.getDeal(dealId);

      // Extract order ID from deal properties
      const orderId = deal.properties?.order_id;
      if (!orderId) {
        logger.warn(`No order ID found in deal ${dealId}`);
        if (syncLog) {
          await syncLogService.logSuccess(syncLog.id, {
            message: 'No order ID in deal',
          });
        }
        return { success: true, message: 'No order ID in deal' };
      }

      // Map deal stage to BigCommerce order status
      const orderStatus = this.mapDealStageToOrderStatus(deal.properties.dealstage);
      
      if (!orderStatus) {
        logger.warn(`No status mapping for deal stage: ${deal.properties.dealstage}`);
        if (syncLog) {
          await syncLogService.logSuccess(syncLog.id, {
            message: 'No status mapping for deal stage',
          });
        }
        return { success: true, message: 'No status mapping' };
      }

      // Update order status in BigCommerce
      await this.bigcommerceClient.updateOrderStatus(orderId, orderStatus);
      logger.info(`Updated BigCommerce order ${orderId} status to ${orderStatus}`);

      if (syncLog) {
        await syncLogService.logSuccess(syncLog.id, { orderId, orderStatus });
      }

      return { success: true, orderId, orderStatus };
    } catch (error) {
      logger.error(`Failed to sync deal ${dealId} to order status`, {
        error: error.message,
      });

      if (syncLog) {
        await syncLogService.logFailure(syncLog.id, error);
      }

      throw error;
    }
  }

  /**
   * Sync marketing preferences between platforms
   */
  async syncMarketingPreferences(contactId, customerId) {
    let syncLog = null;
    try {
      logger.info(`Syncing marketing preferences for contact ${contactId}`);

      syncLog = await syncLogService.createLog({
        syncType: 'marketing_preferences',
        direction: 'hs_to_bc',
        entityType: 'contact',
        entityId: contactId.toString(),
      });

      // Get contact with marketing preferences from HubSpot
      const contact = await this.hubspotClient.getContact(contactId);
      
      // Extract marketing preferences
      const preferences = {
        acceptsMarketing: contact.properties?.marketing_emails_opt_in === 'true',
        acceptsSms: contact.properties?.sms_opt_in === 'true',
      };

      // Update customer preferences in BigCommerce
      await this.bigcommerceClient.updateCustomer(customerId, preferences);
      logger.info(`Updated marketing preferences for customer ${customerId}`);

      if (syncLog) {
        await syncLogService.logSuccess(syncLog.id, { customerId, preferences });
      }

      return { success: true, customerId, preferences };
    } catch (error) {
      logger.error(`Failed to sync marketing preferences`, {
        error: error.message,
      });

      if (syncLog) {
        await syncLogService.logFailure(syncLog.id, error);
      }

      throw error;
    }
  }

  /**
   * Map HubSpot contact to BigCommerce customer format
   */
  mapContactToCustomer(contact) {
    const props = contact.properties || {};
    
    return {
      email: props.email,
      first_name: props.firstname,
      last_name: props.lastname,
      phone: props.phone,
      company: props.company,
      // Add more field mappings as needed
    };
  }

  /**
   * Map HubSpot deal stage to BigCommerce order status
   * This mapping should be configurable via admin interface
   */
  mapDealStageToOrderStatus(dealStage) {
    const stageMapping = {
      'qualifiedtobuy': 'Pending',
      'presentationscheduled': 'Awaiting Payment',
      'decisionmakerboughtin': 'Awaiting Fulfillment',
      'contractsent': 'Awaiting Shipment',
      'closedwon': 'Shipped',
      'closedlost': 'Cancelled',
    };

    return stageMapping[dealStage] || null;
  }

  /**
   * Handle conflicts when data is updated in both systems simultaneously
   */
  async resolveConflict(entityType, entityId, bcData, hsData) {
    logger.info(`Resolving conflict for ${entityType} ${entityId}`);

    // Implement conflict resolution strategy
    // Options:
    // 1. Last write wins (based on timestamp)
    // 2. HubSpot wins (sales team is source of truth)
    // 3. BigCommerce wins (commerce data is source of truth)
    // 4. Merge with business rules

    // For now, implement last write wins
    const bcTimestamp = new Date(bcData.date_modified || bcData.date_created);
    const hsTimestamp = new Date(hsData.properties.hs_lastmodifieddate);

    if (hsTimestamp > bcTimestamp) {
      logger.info('HubSpot data is newer, using HubSpot data');
      return { source: 'hubspot', data: hsData };
    } else {
      logger.info('BigCommerce data is newer, using BigCommerce data');
      return { source: 'bigcommerce', data: bcData };
    }
  }
}

module.exports = BiDirectionalSyncService;
