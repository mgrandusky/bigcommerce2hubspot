const { db } = require('../database');
const logger = require('../utils/logger');

let dbInstance = null;

class SyncLogService {
  constructor() {
    this.SyncLog = null;
    this.initialized = false;
  }

  /**
   * Initialize the service with database models (call once at startup)
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      if (!dbInstance) {
        const database = await require('../database').initializeDatabase();
        dbInstance = database;
      }
      this.SyncLog = dbInstance.models.SyncLog;
      this.initialized = true;
      logger.info('SyncLogService initialized');
    } catch (error) {
      logger.error('Failed to initialize SyncLogService', { error: error.message });
      // Continue without database logging if it fails
    }
  }

  /**
   * Create a new sync log entry
   */
  async createLog({
    syncType,
    direction,
    entityType,
    entityId,
    requestData = null,
    metadata = null,
  }) {
    if (!this.SyncLog) return null;

    try {
      const log = await this.SyncLog.create({
        syncType,
        direction,
        entityType,
        entityId,
        status: 'pending',
        requestData,
        metadata,
        startedAt: new Date(),
      });
      return log;
    } catch (error) {
      logger.error('Failed to create sync log', { error: error.message });
      return null;
    }
  }

  /**
   * Update sync log as successful
   */
  async logSuccess(logId, responseData = null) {
    if (!this.SyncLog || !logId) return;

    try {
      const log = await this.SyncLog.findByPk(logId);
      if (log) {
        const completedAt = new Date();
        await log.update({
          status: 'success',
          responseData,
          completedAt,
          duration: completedAt - log.startedAt,
        });
      }
    } catch (error) {
      logger.error('Failed to update sync log success', { error: error.message });
    }
  }

  /**
   * Update sync log as failed
   */
  async logFailure(logId, error) {
    if (!this.SyncLog || !logId) return;

    try {
      const log = await this.SyncLog.findByPk(logId);
      if (log) {
        const completedAt = new Date();
        await log.update({
          status: 'failed',
          errorMessage: error.message,
          errorStack: error.stack,
          completedAt,
          duration: completedAt - log.startedAt,
          attempts: log.attempts + 1,
        });
      }
    } catch (err) {
      logger.error('Failed to update sync log failure', { error: err.message });
    }
  }

  /**
   * Get sync logs with filters
   */
  async getLogs({ status, entityType, syncType, limit = 100, offset = 0 } = {}) {
    if (!this.SyncLog) return [];

    try {
      const where = {};
      if (status) where.status = status;
      if (entityType) where.entityType = entityType;
      if (syncType) where.syncType = syncType;

      const logs = await this.SyncLog.findAll({
        where,
        order: [['createdAt', 'DESC']],
        limit,
        offset,
      });
      return logs;
    } catch (error) {
      logger.error('Failed to get sync logs', { error: error.message });
      return [];
    }
  }

  /**
   * Get sync statistics
   */
  async getStats(hours = 24) {
    if (!this.SyncLog) return null;

    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);
      
      const total = await this.SyncLog.count({
        where: { createdAt: { [require('sequelize').Op.gte]: since } },
      });

      const successful = await this.SyncLog.count({
        where: {
          status: 'success',
          createdAt: { [require('sequelize').Op.gte]: since },
        },
      });

      const failed = await this.SyncLog.count({
        where: {
          status: 'failed',
          createdAt: { [require('sequelize').Op.gte]: since },
        },
      });

      const pending = await this.SyncLog.count({
        where: {
          status: 'pending',
          createdAt: { [require('sequelize').Op.gte]: since },
        },
      });

      return {
        total,
        successful,
        failed,
        pending,
        successRate: total > 0 ? (successful / total * 100).toFixed(2) : 0,
      };
    } catch (error) {
      logger.error('Failed to get sync stats', { error: error.message });
      return null;
    }
  }
}

// Singleton instance
const syncLogService = new SyncLogService();

module.exports = syncLogService;
