import db from '../models';
import { v4 } from 'uuid'
require('dotenv').config()


export const createRequestService = async ({ fullname, email, subject, message, request_type }) => new Promise(async (resolve, reject) => {
    try {
        if (!fullname || !email || !subject || !message || !request_type) {
            return reject("All fields are required")
        }
        const emailNorm = String(email).trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailNorm || !emailRegex.test(emailNorm)) {
            throw { err: 2, msg: 'Invalid email format' };
        }
        let customerId = null;
        if (db.Customer) {
            const where = {};
            if ('email_normalized' in db.Customer.rawAttributes) {
                where.email_normalized = emailNorm;
            } else {
                where.email = emailNorm;
            }
            const customer = await db.Customer.findOne({ where });
            if (customer) customerId = customer.id;
        }
        let priorityType = null;
        if (request_type === 'feedback' || request_type === 'others') {
            priorityType = 'low';
        } else if (request_type === 'inquiries' || request_type === 'advices') {
            priorityType = 'medium';
        } else if (request_type === 'complaints') {
            priorityType = 'high';
        }
        const newRequest = await db.SupportRequest.create({
            id: v4(),
            fullname,
            email: emailNorm,
            subject,
            message,
            request_type,
            priority: priorityType,
            status: 'pending',
            customer_id: customerId
        });
        if (newRequest) {
            resolve({
                err: 0,
                msg: 'Support request created successfully',
                request: newRequest
            });

        }

    } catch (err) {
        return reject(err)
    }
})


export async function assignRequestToEmployeeService(payload = {}) {
    const { requestId, assignee, managerId = null } = payload;

    if (!requestId || !assignee) {
        throw { err: 1, msg: 'Thiếu requestId hoặc assignee' };
    }

    if (!db.SupportRequest) throw { err: 2, msg: 'Model SupportRequest không tồn tại' };
    if (!db.User) throw { err: 3, msg: 'Model User không tồn tại' };

    const trimmed = String(assignee).trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmail = emailRegex.test(trimmed.toLowerCase());

    let user = null;
    if (isEmail) {
        const emailNorm = trimmed.toLowerCase();
        const where = ('email_normalized' in (db.User.rawAttributes || {}))
            ? { email_normalized: emailNorm }
            : { email: emailNorm };
        user = await db.User.findOne({ where });
        if (!user) throw { err: 4, msg: 'Không tìm thấy nhân viên theo email đã cung cấp' };
    } else {
        const nameQuery = `%${trimmed}%`;
        const candidates = await db.User.findAll({
            where: { fullName: { [Op.like]: nameQuery } },
            limit: 5
        });
        if (!candidates || candidates.length === 0) {
            throw { err: 5, msg: 'Không tìm thấy nhân viên theo tên đã cung cấp' };
        }
        if (candidates.length > 1) {
            const list = candidates.map(u => ({ id: u.id, fullName: u.fullName, email: u.email }));
            throw { err: 6, msg: 'Có nhiều nhân viên trùng tên, vui lòng chọn chính xác (theo email)', candidates: list };
        }
        user = candidates[0];
    }

    if ('role' in (db.User.rawAttributes || {}) && user.role) {
        const allowedRoles = ['employee']; // <-- là mảng, không phải string
        if (!allowedRoles.includes(String(user.role).toLowerCase())) {
            throw { err: 7, msg: `Role '${user.role}' không được phép nhận phân công` };
        }
    }

    const t = await db.sequelize.transaction();
    try {
        const reqRow = await db.SupportRequest.findByPk(requestId, { transaction: t, lock: t.LOCK.UPDATE });
        if (!reqRow) {
            await t.rollback();
            throw { err: 8, msg: 'Không tìm thấy yêu cầu hỗ trợ' };
        }

        const prevAssigned = reqRow.assigned_to ?? null;
        const prevStatus = reqRow.status ?? null;

        reqRow.assigned_to = user.id;
        if (!reqRow.status || reqRow.status === 'pending') {
            reqRow.status = 'in_progress';
        }
        await reqRow.save({ transaction: t });

        const auditEntry = await db.SupportRequestAudit.create({
                id: v4(),
                request_id: reqRow.id,
                action: 'assigned',
                performed_by: managerId,
                performed_at: new Date(),
                data: {
                    previous_assigned_to: prevAssigned,
                    new_assigned_to: user.id,
                    previous_status: prevStatus,
                    new_status: reqRow.status
                }
            }, { transaction: t });

        await t.commit();

        const updated = await db.SupportRequest.findByPk(reqRow.id, {
            include: [
                db.User ? { model: db.User, as: 'user', attributes: ['id', 'fullName', 'email'] } : null,
                db.Customer ? { model: db.Customer, as: 'customer', attributes: ['id', 'fullname', 'email'] } : null
            ].filter(Boolean)
        });

        return {
            err: 0,
            msg: 'Giao công việc thành công',
            request: updated?.toJSON ? updated.toJSON() : updated,
            auditEntry
        };
    } catch (err) {
        try { await t.rollback(); } catch (_) { }
        if (err && err.err && err.msg) throw err;
        if (err && err.parent) {
            console.error('assignByEmailOrName parent:', {
                code: err.parent.code,
                errno: err.parent.errno,
                sqlMessage: err.parent.sqlMessage,
                sql: err.parent.sql
            });
        } else {
            console.error('assignByEmailOrName error:', err);
        }
        throw { err: 99, msg: 'Lỗi hệ thống' };
    }
}