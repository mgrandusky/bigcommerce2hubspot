const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const FieldMapping = sequelize.define('FieldMapping', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Mapping name/description',
    },
    sourceSystem: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'bigcommerce or hubspot',
    },
    targetSystem: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'bigcommerce or hubspot',
    },
    entityType: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'order, contact, deal, product, etc.',
    },
    sourceField: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    targetField: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    transformation: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Optional transformation function name',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Default system mappings',
    },
    priority: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Priority for applying mappings',
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  }, {
    tableName: 'field_mappings',
    timestamps: true,
    indexes: [
      { fields: ['sourceSystem', 'targetSystem', 'entityType'] },
      { fields: ['isActive'] },
    ],
  });

  return FieldMapping;
};
