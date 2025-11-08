const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const ContractService = require('../services/contractB');
const db = require('../models');

/**
 * POST /api/contractB/create
 * Body: form-data:
 *  - title
 *  - customerEmail
 *  - customerName (optional)
 *  - file (file upload)
 *
 * Requires verifyToken middleware to run before this controller, which should set req.user = { id: ... }
 */
exports.createContract = async function (req, res) {
  try {
    // 1) Lấy userId từ token (verifyToken middleware phải set req.user)
    const user = req.user;
    if (!user || !user.id) {
      return res.status(401).json({ error: 'Unauthorized: missing or invalid token' });
    }
    const userId = user.id;

    // 2) Validate input
    const { title, customerEmail, customerName } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });
    if (!customerEmail) return res.status(400).json({ error: 'customerEmail is required' });
    if (!req.file || !req.file.path) return res.status(400).json({ error: 'file is required' });

    const filePath = req.file.path;

    // 3) Tìm customer theo email. Nếu chưa có -> tạo mới
    let customer = await db.Customer.findOne({ where: { email: customerEmail.toLowerCase() } });
    if (!customer) {
      customer = await db.Customer.create({
        id: uuidv4(),
        email: customerEmail.toLowerCase(),
        name: customerName || null
      });
    }
    const customerId = customer.id;

    // 4) Gọi service xử lý upload -> hash -> ghi blockchain -> lưu DB
    const result = await ContractService.createContract({
      title,
      customerId,
      userId,
      filePath,
    });

    // Optionally remove uploaded file after successful save to DB
    try {
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.warn('Warning: unable to remove uploaded file after success', err);
    }

    return res.status(200).json({
      message: '✅ Hợp đồng đã tạo và ghi lên blockchain thành công!',
      data: result,
    });
  } catch (error) {
    console.error('❌ Lỗi trong controller createContract:', error);

    // Cleanup file upload nếu có lỗi
    try {
      if (req && req.file && req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    } catch (e) {
      console.warn('Cleanup file error', e);
    }

    return res.status(500).json({ error: error.message || 'Lỗi khi tạo hợp đồng' });
  }
};