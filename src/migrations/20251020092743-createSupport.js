'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('support_requests', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      fullname: {
        type: Sequelize.STRING(191),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(191),
        allowNull: false
      },
      subject: {
        type: Sequelize.STRING(191),
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      request_type: {
        type: Sequelize.ENUM('complaints', 'advices', 'inquiries', 'feedback', 'others'),
        allowNull: false
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high'),
        allowNull: false,
        defaultValue: 'low'
      },
      status: {
        type: Sequelize.ENUM('pending', 'in_progress', 'completed'),
        allowNull: false,
        defaultValue: 'pending'
      },
      note: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      customer_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'customers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      assigned_to: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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

    // Indexes to speed up common queries
    await queryInterface.addIndex('support_requests', ['email'], { name: 'idx_support_requests_email' });
    await queryInterface.addIndex('support_requests', ['status'], { name: 'idx_support_requests_status' });
    await queryInterface.addIndex('support_requests', ['priority'], { name: 'idx_support_requests_priority' });
    await queryInterface.addIndex('support_requests', ['createdAt'], { name: 'idx_support_requests_created_at' });
  },

  async down(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();

    await queryInterface.dropTable('support_requests');

    // On Postgres, Sequelize creates enum types that need to be removed explicitly
    if (dialect === 'postgres') {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_support_requests_priority";');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_support_requests_status";');
    }
  }
};