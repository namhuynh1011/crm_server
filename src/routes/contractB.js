const express = require('express');
const router = express.Router();
const multer = require('multer');
const contractController = require('../controllers/contractB');

// Cấu hình upload file
const upload = multer({ dest: 'uploads/contracts/' });

// API tạo hợp đồng mới
router.post('/create', upload.single('file'), contractController.createContract);

module.exports = router;
