
const { v4: uuidv4 } = require('uuid');
const db = require('../models');

const Task = db.Task;
const User = db.User;
const Op = db.Sequelize.Op;

// Tạo task mới (chỉ Manager)
async function createTask({ title, description, priority, dueDate, createdBy, assignedTo, assignedToEmail, notes }) {
  // Resolve assignee by email if provided (email takes precedence)
  let assigneeId = null;

  if (assignedToEmail) {
    const email = String(assignedToEmail).trim().toLowerCase();
    if (!email) {
      throw new Error('assignedToEmail không hợp lệ');
    }

    const assignee = await User.findOne({
      where: { email }
    });

    if (!assignee) {
      // Nếu muốn không ném lỗi mà chỉ tạo unassigned, đổi line này thành assigneeId = null;
      throw new Error(`Không tìm thấy user với email: ${email}`);
    }

    if ((assignee.role || '').toLowerCase() !== 'employee') {
      throw new Error('Chỉ có thể giao task cho user có role Employee');
    }

    assigneeId = assignee.id;
  } else if (assignedTo) {
    // Nếu truyền trực tiếp assignedTo (UUID), validate tồn tại & role
    const assignee = await User.findByPk(assignedTo);
    if (!assignee) {
      throw new Error('User được giao không tồn tại');
    }
    if ((assignee.role || '').toLowerCase() !== 'employee') {
      throw new Error('Chỉ có thể giao task cho Employee');
    }
    assigneeId = assignee.id;
  }

  const taskData = {
    id: uuidv4(),
    title,
    description: description || null,
    priority: priority || 'medium',
    dueDate: dueDate ? new Date(dueDate) : null,
    createdBy,
    assignedTo: assigneeId || null,
    notes: notes || null,
    status: 'pending'
  };

  const task = await Task.create(taskData);

  // Load associations (exclude sensitive fields like password)
  const includeUsers = [
    { model: User, as: 'creator', attributes: { exclude: ['password', 'salt'] } },
    { model: User, as: 'assignee', attributes: { exclude: ['password', 'salt'] } }
  ];

  return await Task.findByPk(task.id, { include: includeUsers });
}

// Giao task cho Employee (Manager assign)
async function assignTask({ taskId, assignedTo, managerId }) {
  const task = await Task.findByPk(taskId);
  if (!task) {
    throw new Error('Task không tồn tại');
  }

  // Chỉ creator hoặc manager khác có thể assign
  if (task.createdBy !== managerId) {
    const manager = await User.findByPk(managerId);
    if (!manager || manager.role?.toLowerCase() !== 'manager') {
      throw new Error('Chỉ Manager mới có thể giao task');
    }
  }

  // Validate assignee
  const assignee = await User.findByPk(assignedTo);
  if (!assignee) {
    throw new Error('User được giao không tồn tại');
  }
  if (assignee.role?.toLowerCase() !== 'employee') {
    throw new Error('Chỉ có thể giao task cho Employee');
  }

  await task.update({ 
    assignedTo,
    status: task.status === 'pending' ? 'pending' : task.status
  });

  return await Task.findByPk(taskId, {
    include: [
      { model: User, as: 'creator', attributes: ['id', 'fullName', 'email', 'role'] },
      { model: User, as: 'assignee', attributes: ['id', 'fullName', 'email', 'role'] }
    ]
  });
}

// Lấy danh sách task (theo role)
async function getTasks({ userId, userRole, status, priority, assignedTo, createdBy, limit = 50, offset = 0 }) {
  const where = {};
  
  // Role-based filtering
  if (userRole === 'employee') {
    // Employee chỉ xem task được giao cho mình
    where.assignedTo = userId;
  } else if (userRole === 'manager') {
    // Manager xem task do mình tạo hoặc được giao
    where[Op.or] = [
      { createdBy: userId },
      { assignedTo: userId }
    ];
  }

  // Additional filters
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (assignedTo) where.assignedTo = assignedTo;
  if (createdBy) where.createdBy = createdBy;

  const { count, rows } = await Task.findAndCountAll({
    where,
    include: [
      { model: User, as: 'creator', attributes: ['id', 'fullName', 'email', 'role'] },
      { model: User, as: 'assignee', attributes: ['id', 'fullName', 'email', 'role'] }
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });

  return { tasks: rows, total: count, limit, offset };
}

// Cập nhật trạng thái task (Employee hoặc Manager)
async function updateTaskStatus({ taskId, status, notes, userId, userRole }) {
  const task = await Task.findByPk(taskId);
  if (!task) {
    throw new Error('Task không tồn tại');
  }

  // Permission check
  const canUpdate = (
    (userRole === 'employee' && task.assignedTo === userId) ||
    (userRole === 'manager' && (task.createdBy === userId || task.assignedTo === userId))
  );

  if (!canUpdate) {
    throw new Error('Bạn không có quyền cập nhật task này');
  }

  const updateData = { status };
  if (notes) updateData.notes = notes;
  if (status === 'completed') updateData.completedAt = new Date();
  
  await task.update(updateData);

  return await Task.findByPk(taskId, {
    include: [
      { model: User, as: 'creator', attributes: ['id', 'fullName', 'email', 'role'] },
      { model: User, as: 'assignee', attributes: ['id', 'fullName', 'email', 'role'] }
    ]
  });
}

// Lấy chi tiết task
async function getTaskById({ taskId, userId, userRole }) {
  const task = await Task.findByPk(taskId, {
    include: [
      { model: User, as: 'creator', attributes: ['id', 'fullName', 'email', 'role'] },
      { model: User, as: 'assignee', attributes: ['id', 'fullName', 'email', 'role'] }
    ]
  });

  if (!task) return null;

  // Permission check
  const canView = (
    (userRole === 'employee' && task.assignedTo === userId) ||
    (userRole === 'manager' && (task.createdBy === userId || task.assignedTo === userId)) ||
    userRole === 'admin'
  );

  if (!canView) {
    throw new Error('Bạn không có quyền xem task này');
  }

  return task;
}

module.exports = {
  createTask,
  assignTask,
  getTasks,
  updateTaskStatus,
  getTaskById
};