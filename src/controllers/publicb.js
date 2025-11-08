'use strict';

const { lookupContractByTitleAndEmail } = require('../services/publicb');

async function lookupContract(req, res) {
  try {
    const { contractId, customerEmail } = req.query;

    if (!contractId || !customerEmail) {
      return res.status(400).json({
        err: 1,
        msg: 'Thiếu param: contractId (title) và customerEmail'
      });
    }

    const result = await lookupContractByTitleAndEmail({
      contractId: String(contractId).trim(),
      customerEmail: String(customerEmail).trim().toLowerCase()
    });

    if (!result) {
      return res.status(404).json({
        err: 2,
        msg: 'Không tìm thấy hợp đồng (kiểm tra title hoặc email)'
      });
    }

    return res.json({ err: 0, msg: 'OK', data: result });
  } catch (e) {
    console.error('publicb.controller.lookupContract error', e);
    return res.status(500).json({ err: 99, msg: 'Internal error' });
  }
}

module.exports = { lookupContract };