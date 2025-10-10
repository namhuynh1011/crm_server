import * as customerService from '../services/customer.js';

export const createCustomerController = async (req, res) => {
    const { fullname, email, phone, address } = req.body;
    const createdBy = req.user.id;
    try {
        if (!fullname || !email) {
            return res.status(400).json({ err: 1, msg: 'Missing inputs!' });
        }
        const result = await customerService.createCustomerService(fullname, email, phone, address, createdBy);
        if (result.err) {
            return res.status(400).json(result);
        }
        return res.status(201).json(result);
    } catch (error) {
        return res.status(500).json({ err: 3, msg: 'Failed to create customer: ' + error });
    }
};

export const deleteCustomerController = async (req, res) => {
    const { customerId } = req.params;
    try {
        const result = await customerService.deleteCustomerService(customerId);
        if (result.err) {
            return res.status(400).json(result);
        }
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ err: 3, msg: 'Failed to delete customer: ' + error });
    }
};

export const listCustomersController = async (req, res) => {
    try {
        const result = await customerService.listCustomersService();
        if (result.err) {
            return res.status(400).json(result);
        }
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ err: 3, msg: 'Failed to list customers: ' + error });
    }
};

export const getCustomerDetailController = async (req, res) => {
    const { customerId } = req.params;
    try {
        const result = await customerService.getCustomerDetailService(customerId);
        if (result.err) {
            return res.status(400).json(result);
        }
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ err: 3, msg: 'Failed to get customer detail: ' + error });
    }
}

export const getCustomerOfUserController = async (req, res) => {
    const userId = req.user.id;
    try {
        const result = await customerService.getCustomerOfUserService(userId);
        if (result.err) {
            return res.status(400).json(result);
        }
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ err: 3, msg: 'Failed to get customers of user: ' + error });
    }
}