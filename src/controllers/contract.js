import * as contractService from '../services/contract';

export const createContractController = async (req, res) => {
    try {
        const user_id = req.user.id;
        const pdfFile = req.file;
        const response = await contractService.createContractService({
            ...req.body,
            user_id,
            pdfFile
        });
        return res.status(response.err === 0 ? 201 : 400).json(response);
    } catch (error) {
        return res.status(500).json({ err: 99, msg: 'Failed to create contract: ' + (error.message || JSON.stringify(error)) });
    }
};