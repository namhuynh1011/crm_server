const express = require('express');
const router = express.Router();
const multer = require('multer');
const contractController = require('../controllers/contractB');

// Import verifyToken middleware (đảm bảo middleware export đúng CommonJS)
const verifyToken = require('../middlewares/verifyToken');

// upload config: bạn có thể cấu hình storage, limit, fileFilter...
const upload = multer({ dest: 'uploads/contracts/' });

// POST /api/contractB/create
// Flow: verifyToken -> multer upload -> controller
router.post('/create', verifyToken, upload.single('file'), contractController.createContract);

module.exports = router;