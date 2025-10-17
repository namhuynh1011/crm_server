'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('../models'); // Sequelize index that exports models and sequelize
const { Blockchain, Block } = require('./chain'); // ensure chain exports Block and Blockchain
const { v4 } = require('uuid');

// thêm import service gửi mail (CommonJS)
const publicService = require('./public');

const CHAIN_FILE = path.resolve(__dirname, '../../data/localChain.json');

// Load or init localChain
let localChain;
try {
  localChain = Blockchain.loadFromFile(CHAIN_FILE);
  if (!localChain || !localChain.chain) localChain = new Blockchain(2);
} catch (e) {
  console.error('Error loading local chain', e);
  localChain = new Blockchain(2);
}

// helper: generate a random alphanumeric code (length ~ n)
function generateVerificationCode(n = 10) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'; // omit confusing chars
  const bytes = crypto.randomBytes(n);
  let result = '';
  for (let i = 0; i < n; i++) {
    result += alphabet[bytes[i] % alphabet.length];
  }
  return result;
}

/**
 * Create new contract + document + block (local chain proof)
 */
async function createContract({ pdfFile, contractFields = {}, userId = null }) {
  if (!pdfFile) return { err: 1, msg: 'Missing pdf file' };
  if (!userId) return { err: 2, msg: 'Missing user id' };

  const filePath = pdfFile.path;
  if (!filePath || !fs.existsSync(filePath)) {
    return { err: 3, msg: 'Uploaded file not found on disk' };
  }

  // read file and compute sha256
  let fileBuffer;
  try {
    fileBuffer = fs.readFileSync(filePath);
  } catch (e) {
    return { err: 3, msg: 'Cannot read uploaded file: ' + e.message };
  }
  const document_hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

  // generate verification code and its hash (store hash only)
  const verificationCode = generateVerificationCode(10); // plaintext to return to caller (print/QR)
  const verification_code_hash = crypto.createHash('sha256').update(verificationCode, 'utf8').digest('hex');

  const transaction = await db.sequelize.transaction();
  try {
    // check customer if provided
    const customerId = contractFields.customer_id || null;
    if (customerId) {
      const customer = await db.Customer.findByPk(customerId, { transaction });
      if (!customer) {
        await transaction.rollback();
        return { err: 4, msg: `Customer not found: ${customerId}` };
      }
    }

    // create contract
    const contract = await db.Contract.create({
      id: v4(),
      contract_code: contractFields.contract_code,
      title: contractFields.title,
      description: contractFields.description,
      contract_value: contractFields.contract_value,
      start_date: contractFields.start_date,
      end_date: contractFields.end_date,
      status: contractFields.status || 'draft',
      payment_terms: contractFields.payment_terms,
      customer_id: contractFields.customer_id || null,
      user_id: userId
    }, { transaction });

    // determine next version
    const lastDoc = await db.Document.findOne({
      where: { contract_id: contract.id },
      order: [['version', 'DESC']],
      transaction
    });
    const nextVersion = lastDoc ? lastDoc.version + 1 : 1;

    // create document record, include verification_code_hash
    // NOTE: ensure your Sequelize model has attribute 'verification_code_hash' or mapping for it.
    const document = await db.Document.create({
      id: v4(),
      contract_id: contract.id,
      version: nextVersion,
      filename: pdfFile.originalname || path.basename(filePath),
      storage_provider: 'local',
      storage_key: filePath,
      url: null,
      mime_type: pdfFile.mimetype || 'application/pdf',
      file_size: pdfFile.size || fileBuffer.length,
      sha256_hash: document_hash,
      hash_algorithm: 'sha256',
      verification_code_hash: verification_code_hash,
      uploaded_by: userId,
      uploaded_at: new Date()
    }, { transaction });

    // Prepare block data and create a mined block object WITHOUT pushing into localChain
    // Determine prevHash safely
    let prevHash = '0000';
    try {
      if (typeof localChain.getLastBlock === 'function') {
        const lb = localChain.getLastBlock();
        prevHash = lb ? (lb.hash || lb.block_hash || '0000') : '0000';
      } else if (Array.isArray(localChain.chain) && localChain.chain.length) {
        const lb = localChain.chain[localChain.chain.length - 1];
        prevHash = lb ? (lb.hash || lb.block_hash || '0000') : '0000';
      }
    } catch (e) {
      console.warn('Failed to determine prevHash from localChain', e);
      prevHash = '0000';
    }

    const blockData = {
      document_hash: document_hash,
      document_id: document.id,
      contract_id: contract.id,
      uploaded_by: userId,
      filename: document.filename,
      uploaded_at: new Date().toISOString()
    };

    // Create block instance and mine it (this does not mutate localChain)
    const tempBlock = new Block(prevHash, blockData);
    // ensure Block.mine exists
    if (typeof tempBlock.mine === 'function') {
      tempBlock.mine(localChain.difficulty);
    } else {
      // if Block.mine not available, you may need to call a different method or remove mining
      console.warn('Block.mine not found - skipping mining step');
    }

    // save block record in DB (inside transaction) using mined hash/nonce
    const blockRecord = await db.Block.create({
      id: v4(),
      document_id: document.id,
      prev_hash: tempBlock.prevHash || prevHash || null,
      block_hash: tempBlock.hash || tempBlock.block_hash || null,
      nonce: tempBlock.nonce || 0,
      difficulty: localChain.difficulty,
      block_index: Array.isArray(localChain.chain) ? localChain.chain.length : 0, // index before push
      block_data: {
        timeStamp: tempBlock.timeStamp,
        data: tempBlock.data,
        nonce: tempBlock.nonce
      }
    }, { transaction });

    // commit transaction
    await transaction.commit();

    // After commit, push block into in-memory chain and persist
    try {
      if (!Array.isArray(localChain.chain)) localChain.chain = [];
      localChain.chain.push(tempBlock);
      if (typeof localChain.saveToFile === 'function') {
        localChain.saveToFile(CHAIN_FILE);
      } else {
        // implement save if missing
        console.warn('localChain.saveToFile not implemented');
      }
    } catch (e) {
      console.warn('Failed to persist local chain file after DB commit:', e.message);
    }

    // SEND VERIFICATION EMAIL (non-fatal) - call publicService to email customer
    try {
      // call and log result so we know whether email was attempted
      const emailRes = await publicService.sendVerificationEmail(verificationCode, contract.toJSON ? contract.toJSON() : contract, document.toJSON ? document.toJSON() : document, userId);
      console.log('sendVerificationEmail result:', emailRes);
    } catch (e) {
      console.warn('Error while sending verification email (ignored for commit):', e);
    }

    // return plaintext verificationCode so caller can print/QR it
    return {
      err: 0,
      verification_code: verificationCode,
      msg: 'Contract created with local chain proof',
      contract: contract.toJSON ? contract.toJSON() : contract,
      document: document.toJSON ? document.toJSON() : document,
      block: blockRecord.toJSON ? blockRecord.toJSON() : blockRecord
    };
  } catch (e) {
    try { await transaction.rollback(); } catch (_) {}
    console.error('createContract error', e);
    return { err: 5, msg: 'Error creating contract: ' + (e.message || e) };
  }
}

module.exports = { createContract, localChain };