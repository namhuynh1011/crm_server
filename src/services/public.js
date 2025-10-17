'use strict';

const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const { v4 } = require('uuid');
const db = require('../models'); // Sequelize index (same shape as your project)

// Config fallback
const PUBLIC_BASE_PATH = (process.env.PUBLIC_BASE_PATH || '').replace(/\/$/, '') || null;

const CHAIN_FILE = path.resolve('data/localChain.json');
// Base path for public endpoints - set via env or default to '/public'
// const PUBLIC_BASE_PATH = process.env.PUBLIC_BASE_PATH || '/public';

/**
 * findByCode(code)
 * - normalize code (trim)
 * - compute sha256(code)
 * - find document by verification_code_hash (ensure model mapping exists)
 * - include contract + customer (no blocks include)
 * - fetch last block separately
 * - verify local chain best-effort
 */
export async function findByCode(code) {
  if (!code) return null;

  // normalize input
  const codeTrimmed = String(code).trim();
  if (!codeTrimmed) return null;

  const codeHash = crypto.createHash('sha256').update(codeTrimmed).digest('hex');
  // debug log (remove or lower level in production)
  // console.log('DEBUG findByCode', { code: codeTrimmed, codeHash });

  // find document by hashed verification code
  // Note: ensure your model Document defines verification_code_hash column or mapping
  const doc = await db.Document.findOne({
    where: { verification_code_hash: codeHash },
    include: [
      { model: db.Contract, as: 'contract', include: [{ model: db.Customer, as: 'customer' }] }
      // Do not include blocks here with limit; we'll fetch last block separately
    ]
  });

  if (!doc) {
    return null;
  }

  // get last block (separate query, reliable)
  let lastBlock = null;
  try {
    lastBlock = await db.Block.findOne({
      where: { document_id: doc.id },
      order: [['createdAt', 'DESC']]
    });
  } catch (e) {
    console.warn('publicService: error finding last block', e);
  }

  // Optional: verify local chain integrity (best-effort)
  let chainValid = true;
  try {
    if (fs.existsSync(CHAIN_FILE)) {
      const chain = Blockchain.loadFromFile(CHAIN_FILE);
      // If chain.isValid() exists, use it
      if (typeof chain.isValid === 'function') {
        chainValid = !!chain.isValid();
      }
      // also check that a block with same block_hash exists in chain
      if (lastBlock && Array.isArray(chain.chain)) {
        // chain blocks may use different property names: try 'hash' or 'block_hash'
        const found = chain.chain.find(b => (b.hash && b.hash === lastBlock.block_hash) || (b.block_hash && b.block_hash === lastBlock.block_hash));
        if (!found) {
          // chain may be valid but block not present
          chainValid = false;
        }
      }
    }
  } catch (e) {
    console.warn('publicService: chain verification failed', e);
    chainValid = false;
  }

  // Build minimal public response (avoid exposing PII)
  const result = {
    contract: {
      id: doc.contract?.id || null,
      contract_code: doc.contract?.contract_code || null,
      title: doc.contract?.title || null,
      createdAt: doc.contract?.createdAt || null
    },
    customer: doc.contract?.customer ? { id: doc.contract.customer.id, name: doc.contract.customer.name } : null,
    document: {
      id: doc.id,
      filename: doc.filename,
      sha256_hash: doc.sha256_hash,
      uploaded_at: doc.uploaded_at,
      mime_type: doc.mime_type,
      file_size: doc.file_size,
      storage_provider: doc.storage_provider,
      // public URL to fetch pdf (uses PUBLIC_BASE_PATH so it matches mount)
      pdf_url: `${PUBLIC_BASE_PATH}/documents/${doc.id}/pdf`
    },
    block: lastBlock ? {
      block_hash: lastBlock.block_hash,
      prev_hash: lastBlock.prev_hash,
      block_index: lastBlock.block_index,
      block_data: lastBlock.block_data,
      createdAt: lastBlock.createdAt
    } : null,
    chain_valid: chainValid
  };

  return result;
}

/**
 * helper to get document by id (used by /documents/:id/pdf endpoint)
 */
export async function getDocumentById(id) {
  return db.Document.findByPk(id);
}



/**
 * sendVerificationEmail(verificationCode, contract, document, userId)
 * - verificationCode: plaintext code generated when creating contract
 * - contract: contract object (should contain contract.id, contract.contract_code, contract.customer_id)
 * - document: document object (should contain document.id)
 * - userId: id of user who performed action (optional)
 *
 * Returns: { ok: true, info, previewUrl } or { ok: false, reason }
 */
async function sendVerificationEmail(verificationCode, contract, document, userId = null) {
  if (!verificationCode || !contract || !document) {
    return { ok: false, reason: 'missing_args' };
  }

  // load customer email if possible
  let customer = null;
  try {
    if (contract.customer_id) {
      customer = await db.Customer.findByPk(contract.customer_id);
    }
  } catch (e) {
    console.warn('sendVerificationEmail: failed to load customer', e);
  }

  const customerEmail = customer && customer.email ? customer.email : null;
  if (!customerEmail) {
    console.log('sendVerificationEmail: no customer email found for contract', contract.id);
    return { ok: false, reason: 'no_customer_email' };
  }

  // Build verify URL (absolute) - prefer PUBLIC_BASE_PATH env
  let verifyUrl;
  if (process.env.PUBLIC_BASE_PATH && process.env.PUBLIC_BASE_PATH.trim()) {
    verifyUrl = `${process.env.PUBLIC_BASE_PATH.replace(/\/$/, '')}/verify?code=${encodeURIComponent(verificationCode)}`;
  } else if (PUBLIC_BASE_PATH) {
    verifyUrl = `${PUBLIC_BASE_PATH}/verify?code=${encodeURIComponent(verificationCode)}`;
  } else {
    // fallback: relative link (not suitable for email recipients outside)
    verifyUrl = `/public/verify?code=${encodeURIComponent(verificationCode)}`;
  }

  // Create transporter from env
  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT) {
    console.warn('sendVerificationEmail: SMTP config missing (SMTP_HOST/SMTP_PORT)');
    return { ok: false, reason: 'smtp_config_missing' };
  }

  const transporterConfig = {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: (process.env.SMTP_SECURE === 'true'),
    auth: undefined,
  };

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporterConfig.auth = {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    };
  }

  // optional TLS dev override (ONLY if you explicitly want)
  if (process.env.SMTP_TLS_REJECT_UNAUTHORIZED === 'false') {
    transporterConfig.tls = { rejectUnauthorized: false };
  }

  let transporter;
  try {
    transporter = nodemailer.createTransport(Object.assign({}, transporterConfig, { logger: false, debug: false }));
    // optionally verify connection (may be skipped in high-volume flows)
    try {
      await transporter.verify();
    } catch (vErr) {
      console.warn('sendVerificationEmail: transporter.verify() failed', vErr && vErr.message ? vErr.message : vErr);
      // continue to attempt send — returning an informative object below if needed
    }
  } catch (e) {
    console.error('sendVerificationEmail: failed to create transporter', e);
    return { ok: false, reason: 'transporter_create_failed', err: e.message || e };
  }

  // generate QR code (data URL) for verify link (best-effort)
  let qrDataUrl = null;
  try {
    qrDataUrl = await QRCode.toDataURL(verifyUrl);
  } catch (e) {
    console.warn('sendVerificationEmail: QRCode generation failed', e);
  }

  // prepare mail html
  const html = `
    <p>Xin chào ${customer && customer.name ? customer.name : ''},</p>
    <p>Hợp đồng <b>${contract.contract_code || ''}</b> đã được tạo. Mã tra cứu (dùng để xác thực hợp đồng) là:</p>
    <p style="font-size:20px; font-weight:bold; letter-spacing:2px;">${verificationCode}</p>
    <p>Bạn có thể truy cập: <a href="${verifyUrl}">${verifyUrl}</a></p>
    ${qrDataUrl ? `<p>Hoặc quét mã QR bên dưới:</p><p><img src="${qrDataUrl}" alt="QR code" /></p>` : ''}
    <p>Trân trọng,<br/>Đội ngũ</p>
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.SMTP_USER || 'no-reply@example.com',
    to: customerEmail,
    subject: `Mã tra cứu hợp đồng ${contract.contract_code || ''}`,
    html
  };

  try {
    const info = await transporter.sendMail(mailOptions);

    // optional: write audit log (best-effort)
    try {
      if (db.AuditLog && typeof db.AuditLog.create === 'function') {
        await db.AuditLog.create({
          id: v4(),
          entity_type: 'Email',
          entity_id: document.id,
          action: 'send_verification_email',
          performed_by: userId || null,
          data: { to: customerEmail, messageId: info.messageId, verifyUrl }
        });
      }
    } catch (e) {
      console.warn('sendVerificationEmail: AuditLog write failed', e && e.message ? e.message : e);
    }

    // nodemailer.getTestMessageUrl(info) returns preview URL only for Ethereal
    let previewUrl = null;
    try {
      if (typeof nodemailer.getTestMessageUrl === 'function') {
        previewUrl = nodemailer.getTestMessageUrl(info);
      }
    } catch (e) {
      // ignore
    }

    return { ok: true, info, previewUrl };
  } catch (e) {
    console.error('sendVerificationEmail: sendMail failed', e && e.message ? e.message : e);

    // write failure audit log
    try {
      if (db.AuditLog && typeof db.AuditLog.create === 'function') {
        await db.AuditLog.create({
          id: v4(),
          entity_type: 'Email',
          entity_id: document.id,
          action: 'send_verification_email_failed',
          performed_by: userId || null,
          data: { to: customerEmail, error: e && e.message ? e.message : String(e) }
        });
      }
    } catch (ee) {
      console.warn('sendVerificationEmail: AuditLog write for failure also failed', ee);
    }

    return { ok: false, reason: 'send_failed', err: e && e.message ? e.message : e };
  }
}

module.exports = {
  sendVerificationEmail
};