const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../models');

// Đảm bảo module blockchain export { web3, contract }
const { web3, contract } = require('../../blockchain/blockchain');

const ContractB = db.ContractB || db.Contract; // fallback nếu tên model khác

async function createContract({ title, customerId, userId, filePath }) {
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error('File không tồn tại: ' + filePath);
  }
  // Read file buffer
  const fileBuffer = fs.readFileSync(filePath);

  // SHA256 hash
  const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

  // Get accounts from web3
  const accounts = await web3.eth.getAccounts();
  if (!accounts || accounts.length === 0) {
    throw new Error('Không có account trong web3 provider');
  }
  const sender = accounts[0];

  // Prepare and send tx: estimate gas first
  let receipt;
  try {
    const method = contract.methods.storeContract(fileHash, ''); // second param placeholder
    // estimateGas may return a BigInt or number (depending on provider)
    const gasEstimateRaw = await method.estimateGas({ from: sender });

    // Normalize gasEstimate to Number safely
    let gasEstimateNumber;
    if (typeof gasEstimateRaw === 'bigint') {
      // convert to Number (safe for typical gas sizes)
      gasEstimateNumber = Number(gasEstimateRaw);
    } else if (typeof gasEstimateRaw === 'object' && gasEstimateRaw.toNumber) {
      // maybe a BN (bignumber.js or BN.js)
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

    // send transaction
    receipt = await method.send({
      from: sender,
      gas: gasToUse,
    });
    // receipt is the transaction receipt object in web3
  } catch (err) {
    console.error('Blockchain tx error:', err);
    // bubble up error to caller (controller will cleanup file)
    throw err;
  }

  // Save to DB
  const payload = {
    id: uuidv4(),
    title,
    customerId,
    userId,
    fileHash,
    blockchainTx: receipt.transactionHash || receipt.transactionHash || receipt.txHash || null,
    filePath,
  };

  const newContract = await ContractB.create(payload);
  return newContract;
}

module.exports = { createContract };