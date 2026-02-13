const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Configuration = sequelize.define('Configuration', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'JSON string value',
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'string',
      comment: 'string, number, boolean, json, encrypted',
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'general, pipeline, workflow, notification, etc.',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isSecret: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether this value should be encrypted',
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  }, {
    tableName: 'configurations',
    timestamps: true,
    indexes: [
      { fields: ['key'], unique: true },
      { fields: ['category'] },
    ],
  });

  return Configuration;
};
