const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../models');
const { web3, contract } = require('../../blockchain/blockchain');
import { getContractById, storeContractHash } from '../../blockchain/blockchain.js';
const Customer = db.Customer;
const ContractB = db.ContractB;

async function createContract({ title, customerId, userId, filePath }) {
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error('File không tồn tại: ' + filePath);
  }
  const fileBuffer = fs.readFileSync(filePath);

  const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

  const accounts = await web3.eth.getAccounts();
  if (!accounts || accounts.length === 0) {
    throw new Error('Không có account trong web3 provider');
  }
  const sender = accounts[0];

  let receipt;
  try {
    const method = contract.methods.storeContract(fileHash, '');
    const gasEstimateRaw = await method.estimateGas({ from: sender });

    let gasEstimateNumber;
    if (typeof gasEstimateRaw === 'bigint') {
      gasEstimateNumber = Number(gasEstimateRaw);
    } else if (typeof gasEstimateRaw === 'object' && gasEstimateRaw.toNumber) {
      try {
        gasEstimateNumber = gasEstimateRaw.toNumber();
      } catch (e) {
        gasEstimateNumber = Number(String(gasEstimateRaw));
      }
    } else {
      gasEstimateNumber = Number(gasEstimateRaw);
    }

    const MIN_GAS = 300000;
    const gasToUse = Math.max(gasEstimateNumber || 0, MIN_GAS);

    receipt = await method.send({
      from: sender,
      gas: gasToUse,
    });
  } catch (err) {
    console.error('Blockchain tx error:', err);
    throw err;
  }
  // const { txHash, contractId } = await storeContractHash(fileHash);
  const payload = {
    id: uuidv4(),
    title,
    customerId,
    userId,
    fileHash,
    blockchainTx: receipt.transactionHash || receipt.transactionHash || receipt.txHash || null,
    // contractIdOnChain: contractId,
    filePath,
  };

  const newContract = await ContractB.create(payload);
  return newContract;
}

const lookupContract = async ({ contractCode, customerEmail }) => {
  // Tìm customer
  const customer = await Customer.findOne({
    where: { email: customerEmail }
  });

  if (!customer) {
    throw new Error('Không tìm thấy khách hàng với email này.');
  }

  // Tìm hợp đồng theo mã + customer
  const contract = await ContractB.findOne({
    where: {
      title: contractCode,
      customerId: customer.id
    }
  });

  if (!contract) {
    throw new Error('Không tìm thấy hợp đồng cho khách hàng này.');
  }

  // Lấy dữ liệu từ blockchain
  const onchainData = await getContractById(contract.contractIdOnChain);

  return {
    contractDB: contract,
    contractBlockchain: onchainData
  };
};

module.exports = { createContract, lookupContract };