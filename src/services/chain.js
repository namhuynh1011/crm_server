'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Simple local chain implementation.
 * Stored file: JSON with { difficulty, chain: [blocks] }
 * Block: { prevHash, data, timeStamp, nonce, hash }
 */

class Block {
  constructor(prevHash, data) {
    this.prevHash = prevHash || '0000';
    this.data = data || {};
    this.timeStamp = new Date().toISOString();
    this.nonce = 0;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    const payload = this.prevHash + JSON.stringify(this.data) + this.timeStamp + this.nonce;
    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  mine(difficulty) {
    const target = '0'.repeat(difficulty || 2);
    while (!this.hash.startsWith(target)) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
    return this.hash;
  }
}

class Blockchain {
  constructor(difficulty = 2) {
    this.difficulty = difficulty;
    const genesis = new Block('0000', { isGenesis: true });
    this.chain = [genesis];
  }

  getLastBlock() {
    return this.chain[this.chain.length - 1];
  }

  addBlock(data) {
    const prev = this.getLastBlock();
    const blk = new Block(prev.hash, data);
    blk.mine(this.difficulty);
    this.chain.push(blk);
    return blk;
  }

  isValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const cur = this.chain[i];
      const prev = this.chain[i - 1];
      if (cur.hash !== cur.calculateHash()) return false;
      if (cur.prevHash !== prev.hash) return false;
    }
    return true;
  }

  saveToFile(filePath) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const data = {
      difficulty: this.difficulty,
      chain: this.chain
    };
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  static loadFromFile(filePath) {
    if (!fs.existsSync(filePath)) return new Blockchain();
    const raw = fs.readFileSync(filePath, 'utf-8');
    try {
      const obj = JSON.parse(raw);
      const bc = new Blockchain(obj.difficulty || 2);
      bc.chain = obj.chain.map(b => {
        const block = new Block(b.prevHash, b.data);
        block.timeStamp = b.timeStamp;
        block.nonce = b.nonce || 0;
        block.hash = b.hash;
        return block;
      });
      return bc;
    } catch (e) {
      console.error('localChain.loadFromFile parse error', e);
      return new Blockchain();
    }
  }
}

module.exports = { Block, Blockchain };