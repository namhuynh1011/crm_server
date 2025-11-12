const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../models');
const { web3, storeContractHash, getContractById } = require('../../blockchain/blockchain');

const Customer = db.Customer;
const ContractB = db.ContractB;

// 📦 Tạo mới hợp đồng, lưu file hash, ghi lên blockchain, và lưu DB
async function createContract({ title, customerId, userId, filePath }) {
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error('File không tồn tại: ' + filePath);
  }

  // 🔒 Hash nội dung file
  const fileBuffer = fs.readFileSync(filePath);
  const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

  // ✅ Ghi lên blockchain
  let blockchainResult;
  try {
    blockchainResult = await storeContractHash(fileHash);
  } catch (err) {
    console.error('❌ Blockchain tx error:', err);
    throw new Error('Không thể ghi dữ liệu lên blockchain: ' + err.message);
  }

  const { txHash, contractId } = blockchainResult;

  // 💾 Lưu vào cơ sở dữ liệu
  const payload = {
    id: uuidv4(),
    title,
    customerId,
    userId,
    fileHash,
    blockchainTx: txHash,
    contractIdOnChain: contractId,
    filePath,
  };

  const newContract = await ContractB.create(payload);
  return newContract;
}

const lookupContract = async ({ contractCode, customerEmail }) => {
  const customer = await Customer.findOne({ where: { email: customerEmail } });
  if (!customer) throw new Error('Không tìm thấy khách hàng với email này.');

  const contract = await ContractB.findOne({
    where: { title: contractCode, customerId: customer.id }
  });
  if (!contract) throw new Error('Không tìm thấy hợp đồng cho khách hàng này.');

  const onchainData = await getContractById(contract.contractIdOnChain);

  return {
    contractDB: contract,
    contractBlockchain: onchainData
  };
};

module.exports = { createContract, lookupContract };
