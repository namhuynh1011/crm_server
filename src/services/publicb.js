'use strict';

/**
 * Public lookup service
 * - contractId: map vào title (mã hợp đồng user nhập, ví dụ HD-01)
 * - customerEmail: email khách hàng (bắt buộc)
 *
 * Giả định bảng ContractBs có cột: id, title, customerId, userId, fileHash, blockchainTx, filePath...
 * KHÔNG cố truy vấn customer_id / user_id.
 */

const db = require('../models');
const Sequelize = db.Sequelize;
const Op = Sequelize.Op;

async function lookupContractByTitleAndEmail({ contractId, customerEmail }) {
  const ContractModel = db.ContractB;
  if (!ContractModel) throw new Error('ContractB model not found');
  if (!contractId || !customerEmail) return null;

  // Tìm customer theo email
  const customer = await db.Customer.findOne({
    where: { email: String(customerEmail).toLowerCase() }
  });
  if (!customer) return null;

  // Case-insensitive title
  const codeLower = String(contractId).trim().toLowerCase();

  // Chỉ dùng cột customerId (không dùng snake_case)
  const where = {
    [Op.and]: [
      Sequelize.where(
        Sequelize.fn('LOWER', Sequelize.col('title')),
        codeLower
      ),
      { customerId: customer.id }
    ]
  };

  // Giới hạn attributes để tránh Sequelize tự “đoán” snake_case
  const attrs = ['id', 'title', 'customerId', 'userId', 'fileHash', 'blockchainTx', 'filePath', 'createdAt', 'updatedAt'];

  const record = await ContractModel.findOne({ where, attributes: attrs });
  if (!record) return null;

  return { db: record.toJSON(), onchain: null };
}

module.exports = { lookupContractByTitleAndEmail };