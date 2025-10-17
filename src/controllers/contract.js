// ESM version
import * as contractService from '../services/contract.js';

export async function createContractHandler(req, res) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ err: 401, msg: 'Unauthorized' });

    const pdfFile = req.file;
    if (!pdfFile) return res.status(400).json({ err: 2, msg: 'Missing pdf file' });

    const contractFields = {
      contract_code: req.body.contract_code || null,
      title: req.body.title || null,
      description: req.body.description || null,
      contract_value: req.body.contract_value ? Number(req.body.contract_value) : null,
      start_date: req.body.start_date ? new Date(req.body.start_date) : null,
      end_date: req.body.end_date ? new Date(req.body.end_date) : null,
      status: req.body.status || null,
      payment_terms: req.body.payment_terms || null,
      customer_id: req.body.customer_id || null
    };

    const result = await contractService.createContract({ pdfFile, contractFields, userId });

    if (!result || result.err !== 0) {
      const status = result && result.err === 4 ? 400 : 500;
      console.error('createContractHandler service error:', result);
      return res.status(status).json({ err: result ? result.err : 99, msg: result ? result.msg : 'Unknown error' });
    }

    return res.status(201).json({
      err: 0,
      msg: result.msg,
      verification_code: result.verification_code,
      contract: result.contract,
      document: result.document,
      block: result.block
    });
  } catch (e) {
    console.error('createContractHandler error', e);
    return res.status(500).json({ err: 99, msg: e.message || 'Internal error' });
  }
}