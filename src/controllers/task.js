'use strict';

const taskService = require('../services/task');

// POST /api/tasks - Tạo task mới (Manager only)
async function createTask(req, res) {
  try {
    const { title, description, priority, dueDate, assignedTo, assignedToEmail, notes } = req.body;
    const createdBy = req.user.id;

    if (!title) {
      return res.status(400).json({ err: 1, msg: 'Title is required' });
    }

    const task = await taskService.createTask({
      title,
      description,
      priority,
      dueDate,
      createdBy,
      assignedTo,       
      assignedToEmail,   
    });

    return res.status(201).json({ err: 0, msg: 'Task created successfully', data: task });
  } catch (error) {
    console.error('createTask error:', error);
    return res.status(500).json({ err: 99, msg: error.message || 'Internal error' });
  }
}

// PUT /api/tasks/:id/assign - Giao task (Manager only)
async function assignTask(req, res) {
  try {
    const { id: taskId } = req.params;
    const { assignedTo } = req.body;
    const managerId = req.user.id;

    if (!assignedTo) {
      return res.status(400).json({ err: 1, msg: 'assignedTo is required' });
    }

    const task = await taskService.assignTask({ taskId, assignedTo, managerId });
    return res.json({ err: 0, msg: 'Task assigned successfully', data: task });
  } catch (error) {
    console.error('assignTask error:', error);
    return res.status(500).json({ err: 99, msg: error.message || 'Internal error' });
  }
}

// GET /api/tasks - Lấy danh sách task
async function getTasks(req, res) {
  try {
    const { status, priority, assignedTo, createdBy, limit = 50, offset = 0 } = req.query;
    const { id: userId, role: userRole } = req.user;

    const result = await taskService.getTasks({
      userId,
      userRole,
      status,
      priority,
      assignedTo,
      createdBy,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return res.json({ err: 0, msg: 'OK', data: result });
  } catch (error) {
    console.error('getTasks error:', error);
    return res.status(500).json({ err: 99, msg: error.message || 'Internal error' });
  }
}

// GET /api/tasks/:id - Lấy chi tiết task
async function getTaskById(req, res) {
  try {
    const { id: taskId } = req.params;
    const { id: userId, role: userRole } = req.user;

    const task = await taskService.getTaskById({ taskId, userId, userRole });
    
    if (!task) {
      return res.status(404).json({ err: 2, msg: 'Task not found' });
    }

    return res.json({ err: 0, msg: 'OK', data: task });
  } catch (error) {
    console.error('getTaskById error:', error);
    return res.status(500).json({ err: 99, msg: error.message || 'Internal error' });
  }
}

// PUT /api/tasks/:id/status - Cập nhật trạng thái task
async function updateTaskStatus(req, res) {
  try {
    const { id: taskId } = req.params;
    const { status, notes } = req.body;
    const { id: userId, role: userRole } = req.user;

    if (!status) {
      return res.status(400).json({ err: 1, msg: 'status is required' });
    }

    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ err: 1, msg: 'Invalid status' });
    }

    const task = await taskService.updateTaskStatus({ taskId, status, notes, userId, userRole });
    return res.json({ err: 0, msg: 'Task status updated', data: task });
  } catch (error) {
    console.error('updateTaskStatus error:', error);
    return res.status(500).json({ err: 99, msg: error.message || 'Internal error' });
  }
}

module.exports = {
  createTask,
  assignTask,
  getTasks,
  getTaskById,
  updateTaskStatus
};