'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // add verification_code_hash column (sha256 hex 64 chars)
    await queryInterface.addColumn('documents', 'verification_code_hash', {
      type: Sequelize.STRING(64),
      allowNull: true,
      defaultValue: null
    });

    // index for fast lookup
    await queryInterface.addIndex('documents', ['verification_code_hash'], {
      name: 'idx_documents_verification_code_hash'
    });
  },

  async down(queryInterface /* Sequelize */) {
    await queryInterface.removeIndex('documents', 'idx_documents_verification_code_hash').catch(() => {});
    await queryInterface.removeColumn('documents', 'verification_code_hash').catch(() => {});
  }
};