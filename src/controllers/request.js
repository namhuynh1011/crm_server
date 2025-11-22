import * as requestService from '../services/request.js';

export const createRequestController = async (req, res) => {
    try {
        const { fullname, email, subject, message, request_type } = req.body;
        const result = await requestService.createRequestService({ fullname, email, subject, message, request_type });
        return res.status(201).json(result);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

export const assignRequestToEmployeeController = async (req, res) => {
    try {
        const requestId = req.params.id; // lấy từ URL: /assign/:id/agent
        const { assignee } = req.body;   // email hoặc tên nhân viên

        if (!assignee) {
            return res.status(400).json({ err: 2, msg: 'assignee is required (email or name)' });
        }

        const result = await requestService.assignRequestToEmployeeService({
            requestId,
            assignee,
            managerId: req.user?.id || null
        });

        return res.status(200).json(result);
    } catch (error) {
        if (error && error.err && error.msg) {
            // lỗi nghiệp vụ từ service
            const status = error.err === 6 ? 409 : 400; // 409 cho ambiguous candidates
            return res.status(status).json(error);
        }
        console.error('assign controller error:', error);
        return res.status(500).json({ err: 99, msg: 'Internal server error' });
    }
};

export const getRequestsAllController = async (req, res) => {
    try {
        const result = await requestService.getAllRequestsService();
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

export const getRequestByIdController = async (req, res) => {
    try {
        const requestId = req.params.id;
        const result = await requestService.getRequestByIdService(requestId);
        if (result.err) {
            return res.status(404).json(result);
        }
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};