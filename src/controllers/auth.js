import * as authService from '../services/auth';

export const registerController = async (req, res) => {
    const { fullname, email, password, role } = req.body;
    try {
        if (!fullname || !email || !password || !role) {
            return res.status(400).json({ err: 1, msg: 'Missing inputs!' });
        }
        const response = await authService.registerService(fullname, email, password, role);
        if (response.err) return res.status(400).json(response);
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({ err: 1, msg: 'Failed at authController: ' + error });
    }
}

export const loginController = async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            return res.status(400).json({ err: 1, msg: 'Missing inputs!' });
        }
        const response = await authService.loginService(email, password);
        if (response.err) return res.status(400).json(response);
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({ err: 1, msg: 'Failed at authController: ' + error });
    }
}

export const changePasswordController = async (req, res) => {
    const userId = req.user.id || req.body.userId;
    const { oldPassword, newPassword } = req.body;
    try {
        if (!oldPassword || !newPassword) {
            return res.status(400).json({ err: 1, msg: 'Missing inputs!' });
        }
        const response = await authService.changePasswordService(userId, oldPassword, newPassword);
        if (response.err) return res.status(400).json(response);
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({ err: 1, msg: 'Failed at authController: ' + error });
    }
}

export const updateUserController = async (req, res) => {
    const userId = req.user.id;
    const { fullName, avatar } = req.body;
    try {
        const response = await authService.updateUserService(userId, { fullName, avatar });
        if (response.err) return res.status(400).json(response);
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({ err: -1, msg: 'Failed at userController:' + error });
    }
};

export const getUserByIdController = async (req, res) => {
    try {
        // verifyToken middleware phải set req.user
        const requester = req.user;
        if (!requester || !requester.id) {
            return res.status(401).json({ err: 1, msg: 'Unauthorized: missing token or user info' });
        }

        // Nếu muốn hỗ trợ admin xem user khác: ?id=<userId>
        const targetId = req.query.id || requester.id;

        // Optional permission check: only admin can request other user info
        if (targetId !== requester.id) {
            const role = (requester.role || '').toString().toLowerCase();
            if (role !== 'admin') {
                return res.status(403).json({ err: 1, msg: 'Forbidden: cannot view other user info' });
            }
        }

        const userData = await authService.getUserByIdService(targetId);
        if (!userData) {
            return res.status(404).json({ err: 2, msg: 'User not found' });
        }

        return res.json({ err: 0, msg: 'OK', data: userData });
    } catch (error) {
        console.error('getCurrentUser error', error);
        return res.status(500).json({ err: 99, msg: 'Internal error' });
    }
};