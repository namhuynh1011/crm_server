'use strict';

const express = require('express');
const router = express.Router();
import verifyToken from '../middlewares/verifyToken';
const taskController = require('../controllers/task');
import verifyRole from '../middlewares/verifyRole';
// Middleware: tất cả routes cần authentication

// POST /api/tasks - Tạo task (chỉ Manager)
router.post('/',verifyToken, taskController.createTask);
// GET /api/tasks - Lấy danh sách task (Manager: tasks của mình, Employee: tasks được giao)
router.get('/',verifyToken, taskController.getTasks);

// GET /api/tasks/:id - Xem chi tiết task
router.get('/:id', verifyToken, taskController.getTaskById);

// PUT /api/tasks/:id/assign - Giao task (chỉ Manager)
router.put('/:id/assign', verifyToken, verifyRole('manager'), taskController.assignTask);

// PUT /api/tasks/:id/status - Cập nhật trạng thái (Manager và Employee của task đó)
router.put('/:id/status', verifyToken, taskController.updateTaskStatus);

export default router;