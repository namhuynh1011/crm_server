'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Block extends Model {
    static associate(models) {
      // Thiết lập quan hệ nếu model Document đã được đăng ký
      if (models.Document) {
        Block.belongsTo(models.Document, { foreignKey: 'document_id', as: 'document' });
      }
    }
  }

  Block.init({
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    document_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    prev_hash: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    block_hash: {
      type: DataTypes.STRING(128),
      allowNull: false,
      unique: true
    },
    nonce: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    difficulty: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    block_index: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    block_data: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Block',
    tableName: 'blocks',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  });

  return Block;
};