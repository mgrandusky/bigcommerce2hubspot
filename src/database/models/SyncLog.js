const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SyncLog = sequelize.define('SyncLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    syncType: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Type of sync: order, cart, contact, product, etc.',
    },
    direction: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'bc_to_hs or hs_to_bc',
    },
    entityType: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'order, cart, contact, deal, product, etc.',
    },
    entityId: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'BigCommerce or HubSpot entity ID',
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pending',
      comment: 'pending, success, failed, retrying',
    },
    attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    errorStack: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    requestData: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Request payload',
    },
    responseData: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Response data',
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional metadata',
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Duration in milliseconds',
    },
  }, {
    tableName: 'sync_logs',
    timestamps: true,
    indexes: [
      { fields: ['syncType'] },
      { fields: ['status'] },
      { fields: ['entityType', 'entityId'] },
      { fields: ['createdAt'] },
    ],
  });

  return SyncLog;
};
