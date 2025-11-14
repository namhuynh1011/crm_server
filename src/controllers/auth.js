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
    const { fullname, avatar } = req.body;
    try {
        const response = await authService.updateUserService(userId, { fullname, avatar });
        if (response.err) return res.status(400).json(response);
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({ err: -1, msg: 'Failed at userController:' + error });
    }
};