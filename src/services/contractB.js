const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../models');
const {storeContractHash } = require('../../blockchain/blockchain');
const { lookupOnChainByTx } = require('../services/blockchain');
const Customer = db.Customer;
const ContractB = db.ContractB;



// 📦 Tạo mới hợp đồng, lưu file hash, ghi lên blockchain, và lưu DB
// (Thay phần hàm createContract hiện có bằng đoạn này)
async function createContract({ title, customerId, userId, filePath, startDate, endDate, contractValue }) {
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error('File không tồn tại: ' + filePath);
  }

  // 🔒 Hash nội dung file
  const fileBuffer = fs.readFileSync(filePath);
  const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

  // Validate và parse startDate / endDate nếu được cung cấp
  let startDateObj = null;
  let endDateObj = null;
  if (startDate) {
    startDateObj = new Date(startDate);
    if (Number.isNaN(startDateObj.getTime())) {
      throw new Error('startDate không hợp lệ. Định dạng ISO 8601 được khuyến nghị, ví dụ "2025-11-01T00:00:00.000Z"');
    }
  }
  if (endDate) {
    endDateObj = new Date(endDate);
    if (Number.isNaN(endDateObj.getTime())) {
      throw new Error('endDate không hợp lệ. Định dạng ISO 8601 được khuyến nghị');
    }
  }
  if (startDateObj && endDateObj && startDateObj > endDateObj) {
    throw new Error('startDate phải nhỏ hơn hoặc bằng endDate');
  }

  // Validate contractValue nếu có
  let valueNumber = null;
  if (contractValue !== undefined && contractValue !== null && contractValue !== '') {
    // Nếu client gửi chuỗi có dấu phẩy/thousand-sep, hãy đảm bảo client gửi số thẳng
    valueNumber = Number(contractValue);
    if (!Number.isFinite(valueNumber) || valueNumber < 0) {
      throw new Error('contractValue không hợp lệ. Hãy truyền một số dương (ví dụ 1000000 hoặc 1000000.00)');
    }
    // Round to 2 decimals if needed
    valueNumber = Math.round(valueNumber * 100) / 100;
  }

  // ✅ Ghi lên blockchain
  let blockchainResult;
  try {
    blockchainResult = await storeContractHash(fileHash);
  } catch (err) {
    console.error('❌ Blockchain tx error:', err);
    throw new Error('Không thể ghi dữ liệu lên blockchain: ' + (err.message || err));
  }

  const { txHash, contractId } = blockchainResult || {};

  // 💾 Lưu vào cơ sở dữ liệu - thêm các trường startDate, endDate, contractValue
  const payload = {
    id: uuidv4(),
    title,
    customerId,
    userId,
    fileHash,
    blockchainTx: txHash,
    contractIdOnChain: contractId,
    filePath,
    startDate: startDateObj,
    endDate: endDateObj ,
    contractValue: valueNumber,
  };

  const newContract = await ContractB.create(payload);
  return newContract;
}

const lookupContract = async ({ contractCode, customerEmail }) => {
  // 1. Tìm khách hàng
  const customer = await Customer.findOne({ where: { email: customerEmail } });
  if (!customer) throw new Error('Không tìm thấy khách hàng với email này.');

  // 2. Tìm contract trong DB
  const contract = await ContractB.findOne({
    where: { title: contractCode, customerId: customer.id }
  });
  if (!contract) throw new Error('Không tìm thấy hợp đồng cho khách hàng này.');

  if (!contract.blockchainTx) {
    throw new Error("Hợp đồng này chưa ghi lên blockchain");
  }

  // 3. Tra cứu on-chain bằng transaction hash
  const onchainData = await lookupOnChainByTx(contract.blockchainTx);

  return {
    message: "Tra cứu thành công",
    contractDB: contract,
    blockchain: onchainData
  };
};


async function getAllContracts({ limit = 50, offset = 0, customerId, title, order = [['createdAt', 'DESC']] } = {}) {
  if (!ContractB) throw new Error('ContractB model not found');

  const where = {};
  if (customerId) where.customerId = customerId;
  if (title) {
    // case-insensitive match for title
    if (Op && Sequelize.fn) {
      where[Op.and] = Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('title')), String(title).toLowerCase());
    } else {
      where.title = title;
    }
  }

  // include customer (exclude sensitive fields)
  const include = [];
  if (Customer) {
    include.push({
      model: Customer,
      as: 'customer',
    });
  }

  const result = await ContractB.findAndCountAll({
    where,
    include,
    order,
    limit: Number(limit) || 50,
    offset: Number(offset) || 0
  });

  // Normalize output
  const contracts = result.rows.map(r => (r && r.toJSON) ? r.toJSON() : r);

  return {
    total: result.count || 0,
    limit: Number(limit) || 50,
    offset: Number(offset) || 0,
    contracts
  };
}

module.exports = { createContract, lookupContract , getAllContracts };
