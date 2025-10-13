import db from '../models';
import fs from 'fs';
import crypto from 'crypto';
import axios from 'axios';

export const createContractService = async ({
    contract_code, title, description, contract_value, startDate, endDate,
    status, payment_terms, customer_id, user_id, pdfFile
}) => {
    if (!title || !contract_value || !startDate || !endDate || !customer_id || !user_id || !pdfFile) {
        return { err: 1, msg: 'Missing required fields!' };
    }

    // 1. Lưu file đã được lưu sẵn, lấy đường dẫn
    const document_url = `/uploads/contracts/${pdfFile.filename}`;

    // 2. Tính hash SHA-256 file
    const fileBuffer = fs.readFileSync(pdfFile.path);
    const document_hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // 3. Gửi hash lên blockchain (giả định gọi API ngoài, thay bằng real API của bạn)
    let blockchain_transaction_id = null;
    try {
        // Ví dụ POST lên blockchain API
        const bcRes = await axios.post('https://your-blockchain-api/tx', { hash: document_hash });
        blockchain_transaction_id = bcRes.data.transaction_id || null;
    } catch (e) {
        return { err: 3, msg: 'Gửi lên blockchain thất bại: ' + (e.message || e) };
    }

    // 4. Sinh mã hợp đồng (nếu cần, hoặc dùng contract_code truyền lên)
    const newContract = await db.Contract.create({
        contract_code,
        title,
        description,
        contract_value,
        startDate,
        endDate,
        status,
        payment_terms,
        contract_url: document_url,
        blockchain_hash: document_hash,
        blockchain_transaction_id,
        customer_id,
        user_id
    });

    return { err: 0, msg: 'Contract created successfully!', contract: newContract };
};