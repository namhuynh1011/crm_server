'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Document extends Model {
    static associate(models) {
      // Liên kết với Contract (nếu model Contract đã được đăng ký)
      if (models.Contract) {
        Document.belongsTo(models.Contract, { foreignKey: 'contract_id', as: 'contract' });
      }

      // Người tải lên (uploaded_by)
      if (models.User) {
        Document.belongsTo(models.User, { foreignKey: 'uploaded_by', as: 'uploader' });
      }

      // Một document có thể có nhiều block proofs (chỉ bind nếu model Block/LocalBlock tồn tại)
      if (models.Block) {
        Document.hasMany(models.Block, { foreignKey: 'document_id', as: 'blocks' });
      } else if (models.LocalBlock) {
        Document.hasMany(models.LocalBlock, { foreignKey: 'document_id', as: 'localBlocks' });
      }
    }
  }

  Document.init({
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    contract_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    filename: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    storage_provider: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    storage_key: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    url: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    mime_type: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    file_size: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    sha256_hash: {
      type: DataTypes.CHAR(64),
      allowNull: false
    },
    hash_algorithm: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: 'sha256'
    },
    uploaded_by: {
      type: DataTypes.UUID,
      allowNull: true
    },
    uploaded_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    verification_code_hash: {
      type: DataTypes.STRING(64),
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Document',
    tableName: 'documents',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    uniqueKeys: {
      ux_contract_version: {
        fields: ['contract_id', 'version']
      }
    },
    indexes: [
      {
        fields: ['sha256_hash'],
        name: 'idx_documents_sha256'
      }
    ]
  });

  return Document;
};