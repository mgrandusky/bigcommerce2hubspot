const { db } = require('../database');
const logger = require('../utils/logger');

// Default deal stage to order status mapping
// This is loaded from the database, but these are the defaults
const DEFAULT_STAGE_MAPPING = {
  'qualifiedtobuy': 'Pending',
  'presentationscheduled': 'Awaiting Payment',
  'decisionmakerboughtin': 'Awaiting Fulfillment',
  'contractsent': 'Awaiting Shipment',
  'closedwon': 'Shipped',
  'closedlost': 'Cancelled',
};

class MappingService {
  constructor() {
    this.stageMapping = { ...DEFAULT_STAGE_MAPPING };
    this.initialized = false;
  }

  /**
   * Initialize and load mappings from database
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      if (!db.models || !db.models.Configuration) {
        logger.warn('Database not initialized, using default mappings');
        this.initialized = true;
        return;
      }

      // Load stage mapping from configuration
      const config = await db.models.Configuration.findOne({
        where: { key: 'deal_stage_to_order_status_mapping' },
      });

      if (config && config.value) {
        try {
          const customMapping = JSON.parse(config.value);
          this.stageMapping = { ...DEFAULT_STAGE_MAPPING, ...customMapping };
          logger.info('Loaded custom stage mapping from database');
        } catch (error) {
          logger.error('Failed to parse stage mapping config', { error: error.message });
        }
      }

      this.initialized = true;
    } catch (error) {
      logger.error('Failed to initialize MappingService', { error: error.message });
      this.initialized = true; // Continue with defaults
    }
  }

  /**
   * Get BigCommerce order status for HubSpot deal stage
   */
  getDealStageToOrderStatus(dealStage) {
    return this.stageMapping[dealStage] || null;
  }

  /**
   * Update stage mapping configuration
   */
  async updateStageMapping(mapping) {
    try {
      if (!db.models || !db.models.Configuration) {
        throw new Error('Database not initialized');
      }

      const config = await db.models.Configuration.findOne({
        where: { key: 'deal_stage_to_order_status_mapping' },
      });

      const value = JSON.stringify(mapping);

      if (config) {
        await config.update({ value });
      } else {
        await db.models.Configuration.create({
          key: 'deal_stage_to_order_status_mapping',
          value,
          type: 'json',
          category: 'pipeline',
          description: 'Mapping of HubSpot deal stages to BigCommerce order statuses',
        });
      }

      // Update in-memory mapping
      this.stageMapping = { ...DEFAULT_STAGE_MAPPING, ...mapping };
      logger.info('Updated stage mapping configuration');

      return { success: true };
    } catch (error) {
      logger.error('Failed to update stage mapping', { error: error.message });
      throw error;
    }
  }

  /**
   * Get current stage mapping
   */
  getStageMapping() {
    return { ...this.stageMapping };
  }

  /**
   * Reset to default mapping
   */
  async resetToDefaults() {
    try {
      if (!db.models || !db.models.Configuration) {
        throw new Error('Database not initialized');
      }

      await db.models.Configuration.destroy({
        where: { key: 'deal_stage_to_order_status_mapping' },
      });

      this.stageMapping = { ...DEFAULT_STAGE_MAPPING };
      logger.info('Reset stage mapping to defaults');

      return { success: true };
    } catch (error) {
      logger.error('Failed to reset stage mapping', { error: error.message });
      throw error;
    }
  }
}

// Singleton instance
const mappingService = new MappingService();

module.exports = mappingService;
