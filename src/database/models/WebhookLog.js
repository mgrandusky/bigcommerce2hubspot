const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const WebhookLog = sequelize.define('WebhookLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    source: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'bigcommerce, hubspot, custom',
    },
    event: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Event type/scope',
    },
    payload: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    headers: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    signatureValid: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    processed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'received',
      comment: 'received, processing, success, failed',
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  }, {
    tableName: 'webhook_logs',
    timestamps: true,
    indexes: [
      { fields: ['source'] },
      { fields: ['event'] },
      { fields: ['processed'] },
      { fields: ['createdAt'] },
    ],
  });

  return WebhookLog;
};
