const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const ContractService = require('../services/contractB');
const db = require('../models');

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
// ====================== CREATE CONTRACT ======================
const createContract = async function (req, res) {
  const uploadedFilePath = req?.file?.path;

  try {
    // 1. auth
    const user = req.user;
    if (!user || !user.id) {
      return res.status(401).json({ error: 'Unauthorized: missing or invalid token' });
    }
    const userId = user.id;

    // 2. read & validate
    const { title, customerEmail, customerName } = req.body;
    // IMPORTANT: startDate/endDate/contractValue may be strings in form-data
    const rawStart = req.body.startDate;
    const rawEnd = req.body.endDate;
    const rawValue = req.body.contractValue;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'title is required' });
    }
    if (!customerEmail || !isValidEmail(customerEmail)) {
      return res.status(400).json({ error: 'customerEmail is required and must be a valid email' });
    }
    if (!uploadedFilePath || !fs.existsSync(uploadedFilePath)) {
      return res.status(400).json({ error: 'file is required' });
    }

    // 3. Normalize / convert dates & value BEFORE passing to service
    let startDate = null;
    let endDate = null;
    let contractValue = null;

    if (rawStart !== undefined && rawStart !== null && String(rawStart).trim() !== '') {
      const d = new Date(String(rawStart).trim());
      if (Number.isNaN(d.getTime())) {
        return res.status(400).json({ error: 'startDate không hợp lệ. Dùng ISO 8601, ví dụ 2025-11-01T00:00:00.000Z' });
      }
      startDate = d.toISOString(); // pass string ISO hoặc Date object; service sẽ parse
    }

    if (rawEnd !== undefined && rawEnd !== null && String(rawEnd).trim() !== '') {
      const d = new Date(String(rawEnd).trim());
      if (Number.isNaN(d.getTime())) {
        return res.status(400).json({ error: 'endDate không hợp lệ. Dùng ISO 8601' });
      }
      endDate = d.toISOString();
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ error: 'startDate phải nhỏ hơn hoặc bằng endDate' });
    }

    if (rawValue !== undefined && rawValue !== null && String(rawValue).trim() !== '') {
      const n = Number(String(rawValue).replace(/[, ]+/g, ''));
      if (!Number.isFinite(n) || n < 0) {
        return res.status(400).json({ error: 'contractValue không hợp lệ. Hãy truyền số dương' });
      }
      contractValue = Math.round(n * 100) / 100; // 2 decimals
    }

    // 4. find or create customer
    const emailLower = customerEmail.toLowerCase().trim();
    let customer = await db.Customer.findOne({ where: { email: emailLower } });
    if (!customer) {
      customer = await db.Customer.create({
        id: uuidv4(),
        email: emailLower,
        name: customerName || null
      });
    }
    const customerId = customer.id;

    // 5. call service - pass parsed values explicitly
    const payload = {
      title: String(title).trim(),
      customerId,
      userId,
      filePath: uploadedFilePath,
      startDate,       // ISO string or null
      endDate,         // ISO string or null
      contractValue    // number or null
    };

    const result = await ContractService.createContract(payload);

    return res.status(201).json({
      message: '✅ Hợp đồng đã tạo và ghi lên blockchain thành công!',
      data: result
    });
  } catch (error) {
    console.error('❌ Lỗi trong controller createContract:', error);
    const msg = error && error.message ? error.message : 'Lỗi khi tạo hợp đồng';
    return res.status(500).json({ error: msg });
  } finally {
    // always attempt to remove uploaded temp file
    try {
      if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
        fs.unlinkSync(uploadedFilePath);
      }
    } catch (err) {
      console.warn('Warning: unable to remove uploaded file:', err);
    }
  }
};


const lookupContract = async (req, res) => {
  try {
    const { contractCode, customerEmail } = req.body;

    if (!contractCode || !customerEmail) {
      return res.status(400).json({
        message: 'Thiếu tham số contractCode hoặc customerEmail'
      });
    }

    const result = await ContractService.lookupContract({
      contractCode,
      customerEmail
    });

    res.json({
      message: '✅ Tra cứu hợp đồng thành công',
      data: result
    });
  } catch (error) {
    console.error('❌ Lỗi tra cứu:', error);
    res.status(400).json({ message: error.message });
  }
};

async function getAllContractsController(req, res) {
  try {
    const { limit = 50, offset = 0, customerId, title } = req.query;

    const data = await ContractService.getAllContracts({
      limit: parseInt(limit, 10) || 50,
      offset: parseInt(offset, 10) || 0,
      customerId: customerId || undefined,
      title: title || undefined
    });

    return res.json({ err: 0, msg: 'OK', data });
  } catch (error) {
    console.error('getAllContracts error', error);
    return res.status(500).json({ err: 99, msg: error.message || 'Internal error' });
  }
}

module.exports = { createContract, lookupContract, getAllContractsController };