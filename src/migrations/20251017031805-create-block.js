'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('blocks', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      document_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'documents',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      prev_hash:{
        type: Sequelize.TEXT,
        allowNull: true
      },
      block_hash: {
        type: Sequelize.STRING(128),
        allowNull: false,
        unique: true
      },
      nonce:{
        type: Sequelize.BIGINT,
        allowNull: true
      },
      difficulty: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      block_index: {
        type: Sequelize.BIGINT,
        allowNull: true
      },
      block_data:{
        type: Sequelize.JSON,
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

    // Index để tra cứu nhanh theo document_id
    await queryInterface.addIndex('blocks', ['document_id'], {
      name: 'idx_blocks_document'
    });

    // (tuỳ chọn) Index cho block_index nếu bạn query theo index
    // await queryInterface.addIndex('blocks', ['block_index'], { name: 'idx_blocks_index' });
  },

  async down (queryInterface, Sequelize) {
    // remove indexes trước khi drop table
    await queryInterface.removeIndex('blocks', 'idx_blocks_document').catch(() => {});
    // await queryInterface.removeIndex('blocks', 'idx_blocks_index').catch(() => {});
    await queryInterface.dropTable('blocks');
  }
};