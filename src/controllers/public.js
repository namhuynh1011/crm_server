'use strict';

import db from '../models/index.js';
import * as publicService from '../services/public.js';
import { v4 } from 'uuid';
import crypto from 'crypto';

function maskCode(code) {
  if (!code || typeof code !== 'string') return null;
  return code.length <= 6 ? code.slice(0, 2) + '***' : code.slice(0, 3) + '***';
}

function getRequestIp(req) {
  return (req.headers['x-forwarded-for'] || req.ip || '').toString();
}

export async function verifyByQuery(req, res) {
  let code = req.query.code;
  if (!code) return res.status(400).json({ err: 1, msg: 'Missing code parameter' });

  code = String(code).trim();
  if (!code) return res.status(400).json({ err: 1, msg: 'Missing code parameter' });

  try {
    // optional debug: compute hash for troubleshooting (remove in prod)
    // const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    // console.log('DEBUG verifyByQuery', { code, codeHash });

    const result = await publicService.findByCode(code);

    // Prepare audit payload
    const auditData = {
      code_masked: maskCode(code),
      ip: getRequestIp(req),
      user_agent: req.get('user-agent') || null,
      path: req.originalUrl,
      found: !!result
    };

    // Write audit (best-effort). Use action 'view' if found, otherwise 'attempt_verify'
    try {
      await db.AuditLog.create({
        id: v4(),
        entity_type: 'PublicVerify',
        entity_id: result?.document?.id || null,
        action: result ? 'view' : 'attempt_verify',
        performed_by: null,
        data: auditData
      });
    } catch (e) {
      console.warn('AuditLog write failed', e);
      // don't fail the request if audit fails
    }

    if (!result) {
      return res.status(404).json({ err: 2, msg: 'Không tìm thấy hợp đồng tương ứng' });
    }
    return res.json({ err: 0, msg: 'OK', data: result });
  } catch (e) {
    console.error('verifyByQuery error', e);
    return res.status(500).json({ err: 99, msg: 'Internal server error' });
  }
}

export async function verifyByCode(req, res) {
  let code = req.params.code;
  if (!code) return res.status(400).json({ err: 1, msg: 'Missing code parameter' });

  code = String(code).trim();
  if (!code) return res.status(400).json({ err: 1, msg: 'Missing code parameter' });

  try {
    const result = await publicService.findByCode(code);

    const auditData = {
      code_masked: maskCode(code),
      ip: getRequestIp(req),
      user_agent: req.get('user-agent') || null,
      path: req.originalUrl,
      found: !!result
    };

    try {
      await db.AuditLog.create({
        id: v4(),
        entity_type: 'PublicVerify',
        entity_id: result?.document?.id || null,
        action: result ? 'view' : 'attempt_verify',
        performed_by: null,
        data: auditData
      });
    } catch (e) {
      console.warn('AuditLog write failed', e);
    }

    if (!result) {
      return res.status(404).json({ err: 2, msg: 'Không tìm thấy hợp đồng tương ứng' });
    }
    return res.json({ err: 0, msg: 'OK', data: result });
  } catch (e) {
    console.error('verifyByCode error', e);
    return res.status(500).json({ err: 99, msg: 'Internal server error' });
  }
}