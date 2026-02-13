const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const syncLogService = require('../../services/syncLog');
const logger = require('../../utils/logger');

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /admin/sync-logs
 * Get sync logs with filters
 */
router.get('/', async (req, res) => {
  try {
    const { status, entityType, syncType, limit, offset } = req.query;

    const logs = await syncLogService.getLogs({
      status,
      entityType,
      syncType,
      limit: parseInt(limit) || 100,
      offset: parseInt(offset) || 0,
    });

    res.json({ logs });
  } catch (error) {
    logger.error('Failed to get sync logs', { error: error.message });
    res.status(500).json({ error: 'Failed to retrieve sync logs' });
  }
});

/**
 * GET /admin/sync-logs/stats
 * Get sync statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const { hours } = req.query;
    const stats = await syncLogService.getStats(parseInt(hours) || 24);

    res.json({ stats });
  } catch (error) {
    logger.error('Failed to get sync stats', { error: error.message });
    res.status(500).json({ error: 'Failed to retrieve sync statistics' });
  }
});

/**
 * GET /admin/sync-logs/:id
 * Get a specific sync log
 */
router.get('/:id', async (req, res) => {
  try {
    if (!syncLogService.SyncLog) {
      return res.status(500).json({ error: 'Sync log service not initialized' });
    }

    const log = await syncLogService.SyncLog.findByPk(req.params.id);

    if (!log) {
      return res.status(404).json({ error: 'Sync log not found' });
    }

    res.json({ log });
  } catch (error) {
    logger.error('Failed to get sync log', { error: error.message });
    res.status(500).json({ error: 'Failed to retrieve sync log' });
  }
});

/**
 * POST /admin/sync-logs/:id/retry
 * Retry a failed sync
 */
router.post('/:id/retry', async (req, res) => {
  try {
    if (!syncLogService.SyncLog) {
      return res.status(500).json({ error: 'Sync log service not initialized' });
    }

    const log = await syncLogService.SyncLog.findByPk(req.params.id);

    if (!log) {
      return res.status(404).json({ error: 'Sync log not found' });
    }

    if (log.status !== 'failed') {
      return res.status(400).json({ error: 'Can only retry failed syncs' });
    }

    // Reset the log status to pending for retry
    await log.update({
      status: 'pending',
      startedAt: new Date(),
    });

    // TODO: Trigger the actual retry via queue
    res.json({
      message: 'Sync queued for retry',
      log,
    });
  } catch (error) {
    logger.error('Failed to retry sync', { error: error.message });
    res.status(500).json({ error: 'Failed to retry sync' });
  }
});

module.exports = router;
