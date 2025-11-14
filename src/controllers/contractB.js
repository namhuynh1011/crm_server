const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const ContractService = require('../services/contractB');
const db = require('../models');


// ====================== CREATE CONTRACT ======================
const createContract = async function (req, res) {
  try {
    // Lấy user từ token
    const user = req.user;
    if (!user || !user.id) {
      return res.status(401).json({ error: 'Unauthorized: missing or invalid token' });
    }
    const userId = user.id;

    // Validate input
    const { title, customerEmail, customerName } = req.body;

    if (!title) return res.status(400).json({ error: 'title is required' });
    if (!customerEmail) return res.status(400).json({ error: 'customerEmail is required' });
    if (!req.file || !req.file.path) return res.status(400).json({ error: 'file is required' });

    const filePath = req.file.path;

    // Tìm customer hoặc tạo mới
    let customer = await db.Customer.findOne({
      where: { email: customerEmail.toLowerCase() }
    });

    if (!customer) {
      customer = await db.Customer.create({
        id: uuidv4(),
        email: customerEmail.toLowerCase(),
        name: customerName || null
      });
    }

    const customerId = customer.id;

    // Tạo hợp đồng
    const result = await ContractService.createContract({
      title,
      customerId,
      userId,
      filePath,
    });

    // Xóa file upload sau khi xử lý xong
    try {
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.warn('Warning: unable to remove uploaded file:', err);
    }

    return res.status(200).json({
      message: '✅ Hợp đồng đã tạo và ghi lên blockchain thành công!',
      data: result,
    });

  } catch (error) {
    console.error('❌ Lỗi trong controller createContract:', error);

    // Cleanup file nếu lỗi
    try {
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    } catch (e) {}

    return res.status(500).json({ error: error.message || 'Lỗi khi tạo hợp đồng' });
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



module.exports = { createContract, lookupContract };
