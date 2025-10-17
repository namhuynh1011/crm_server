'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('documents', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      contract_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'contracts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      version: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      filename: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      storage_provider: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      storage_key: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      url: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      mime_type:{
        type: Sequelize.TEXT,
        allowNull: true
      },
      file_size:{
        type: Sequelize.BIGINT,
        allowNull: true
      },
      sha256_hash:{
        type: Sequelize.CHAR(64),
        allowNull: false
        // not unique here so same file/hash can be reused across contracts if needed
      },
      hash_algorithm:{
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: 'sha256'
      },
      uploaded_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      uploaded_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // unique constraint: a contract cannot have two documents with same version
    await queryInterface.addConstraint('documents', {
      fields: ['contract_id', 'version'],
      type: 'unique',
      name: 'ux_documents_contract_version'
    });

    // index on sha256_hash for fast lookup (used in verification)
    await queryInterface.addIndex('documents', ['sha256_hash'], {
      name: 'idx_documents_sha256'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeIndex('documents', 'idx_documents_sha256');
    await queryInterface.removeConstraint('documents', 'ux_documents_contract_version');
    await queryInterface.dropTable('documents');
  }
};