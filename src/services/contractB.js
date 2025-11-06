// src/services/contractB.js
const fs = require('fs');
const crypto = require('crypto');
const { web3, contract } = require('../../blockchain/blockchain');
const db = require('../models');
import { v4 } from 'uuid'

const ContractB = db.ContractB; // nếu bạn có model ContractB

const createContract = async ({ title, customerId, userId, filePath }) => {
  // Đọc file PDF
  const fileBuffer = fs.readFileSync(filePath);

  // Tạo hash SHA256
  const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

  // Lấy tài khoản đầu tiên (ganache)
  const accounts = await web3.eth.getAccounts();
  const sender = accounts[0];

  // Ghi hash lên blockchain
  const tx = await contract.methods.storeContract(fileHash, '').send({
    from: sender,
    gas: 300000,
  });

  // Lưu kết quả vào DB
  const newContract = await ContractB.create({
    id: v4(),
    title,
    customerId,
    userId,
    fileHash,
    blockchainTx: tx.transactionHash,
    filePath,
  });

  console.log('✅ Hợp đồng mới đã được tạo:', newContract.id);
  return newContract;
};

module.exports = { createContract };
