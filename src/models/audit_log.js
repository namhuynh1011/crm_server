'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AuditLog extends Model {
    static associate(models) {
      // liên kết đến user thực hiện action
      if (models.User) {
        AuditLog.belongsTo(models.User, { foreignKey: 'performed_by', as: 'performer' });
      }
    }
  }

  AuditLog.init({
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    entity_type: {
      type: DataTypes.STRING(191),
      allowNull: true
    },
    entity_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    action: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    performed_by: {
      type: DataTypes.STRING(191),
      allowNull: true
    },
    data: {
      type: DataTypes.JSON, // chỉ dùng với Postgres
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'AuditLog',
    tableName: 'audit_logs',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  });

  return AuditLog;
};