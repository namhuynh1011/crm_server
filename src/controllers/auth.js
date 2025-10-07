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