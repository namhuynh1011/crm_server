import * as ContractService from '../services/contractB.js';

export const createContract = async (req, res) => {
  try {
    const { title, customerId, userId } = req.body;
    const filePath = req.file.path;

    const result = await ContractService.createContract({
      title,
      customerId,
      userId,
      filePath,
    });

    res.status(200).json({
      message: '✅ Hợp đồng đã tạo và ghi lên blockchain thành công!',
      data: result,
    });
  } catch (error) {
    console.error('❌ Lỗi trong controller:', error);
    res.status(500).json({ error: error.message || 'Lỗi khi tạo hợp đồng' });
  }
};
