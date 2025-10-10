import * as userService from '../services/user';

export const getAllUsersController = async (req, res) => {
    try {
        const response = await userService.getAllUsersService();
        if (response.err) return res.status(400).json(response);
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({ err: -1, msg: 'Failed at userController:' + error });
    }
}

export const getUserByIdController = async (req, res) => {
    const userId = req.params.id;
    try {
        const response = await userService.getUserByIdService(userId);
        if (response.err) return res.status(400).json(response);
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({ err: -1, msg: 'Failed at userController:' + error });
    }
}

export const deleteUserController = async (req, res) => {
    const userId = req.params.id;
    try {
        const response = await userService.deleteUserService(userId);
        if (response.err) return res.status(400).json(response);
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({ err: -1, msg: 'Failed at userController:' + error });
    }
}

export const blockUserController = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // status: true (khóa), false (mở khóa)
    try {
        // Kiểm tra giá trị status hợp lệ (phải là boolean)
        if (typeof status !== 'boolean') {
            return res.status(400).json({ err: 1, msg: 'Status must be boolean (true/false)!' });
        }

        const response = await userService.blockUserService(id, status);
        return res.status(response.err === 0 ? 200 : 400).json(response);
    } catch (error) {
        return res.status(500).json({ err: 2, msg: 'Failed at blockUserController: ' + error });
    }
};

export const createUserController = async (req, res) => {
    const {fullname, email, password, role} = req.body;
    try {
        const response = await userService.createUserService({fullname, email, password, role});
        if (response.err) return res.status(400).json(response);
        return res.status(201).json(response);
    } catch (error) {
        return res.status(500).json({ err: -1, msg: 'Failed at userController:' + error });
    }
};

export const updateUserController = async (req, res) => {
    const userId = req.user.id;
    const { fullname, avatar } = req.body;
    try {
        const response = await userService.updateUserService(userId, { fullname, avatar });
        if (response.err) return res.status(400).json(response);
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({ err: -1, msg: 'Failed at userController:' + error });
    }
};