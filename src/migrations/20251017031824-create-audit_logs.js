'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // (Tuỳ nếu bạn chưa tạo extension uuid-ossp ở đâu khác, bạn có thể tạo extension trước)
    // await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    await queryInterface.createTable('audit_logs', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      entity_type:{
        type: Sequelize.STRING(191),
        allowNull: true
      },
      entity_id:{
        type: Sequelize.UUID,
        allowNull: true
      },
      action:{
        type: Sequelize.TEXT,
        allowNull: false
      },
      performed_by:{
        type: Sequelize.STRING(191),
        allowNull: true
      },
      data:{
        type: Sequelize.JSON,
        allowNull: false
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

    // Indexes hữu ích cho tìm kiếm log theo entity hoặc theo user
    await queryInterface.addIndex('audit_logs', ['entity_type', 'entity_id'], {
      name: 'idx_audit_entity'
    });

    await queryInterface.addIndex('audit_logs', ['performed_by'], {
      name: 'idx_audit_performed_by'
    });
  },

  async down (queryInterface, Sequelize) {
    // Loại bỏ index trước khi drop table (an toàn)
    await queryInterface.removeIndex('audit_logs', 'idx_audit_entity').catch(() => {});
    await queryInterface.removeIndex('audit_logs', 'idx_audit_performed_by').catch(() => {});
    await queryInterface.dropTable('audit_logs');
  }
};