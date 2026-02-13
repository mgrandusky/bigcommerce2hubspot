const { Sequelize } = require('sequelize');
const { config } = require('../config');
const logger = require('../utils/logger');

// Initialize Sequelize based on configuration
const sequelize = new Sequelize({
  dialect: config.database.dialect || 'sqlite',
  storage: config.database.storage || './data/database.sqlite',
  host: config.database.host,
  port: config.database.port,
  database: config.database.database,
  username: config.database.username,
  password: config.database.password,
  logging: config.database.logging ? (msg) => logger.debug(msg) : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

// Import models
const SyncLog = require('./models/SyncLog')(sequelize);
const FieldMapping = require('./models/FieldMapping')(sequelize);
const Configuration = require('./models/Configuration')(sequelize);
const User = require('./models/User')(sequelize);
const WebhookLog = require('./models/WebhookLog')(sequelize);

// Set up associations
// Add any model associations here

const db = {
  sequelize,
  Sequelize,
  models: {
    SyncLog,
    FieldMapping,
    Configuration,
    User,
    WebhookLog,
  },
};

/**
 * Initialize database connection and run migrations
 */
async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully');

    // Sync models in development, use migrations in production
    if (config.nodeEnv === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('Database models synchronized');
    }

    return db;
  } catch (error) {
    logger.error('Unable to connect to the database', { error: error.message });
    throw error;
  }
}

/**
 * Close database connection
 */
async function closeDatabase() {
  try {
    await sequelize.close();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection', { error: error.message });
  }
}

module.exports = {
  db,
  initializeDatabase,
  closeDatabase,
  sequelize,
};
