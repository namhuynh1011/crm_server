import express from 'express';
import * as publicController from '../controllers/public.js';
import rateLimit from '../middlewares/rateLimit.js';

const router = express.Router();

// Public verify by query ?code=...
router.get('/verify', rateLimit.public, publicController.verifyByQuery);

// Shortcode path /public/verify/:code
router.get('/verify/:code', rateLimit.public, publicController.verifyByCode);

// Flexible verify by code (query or param)
// router.get('/verify/flexible/:code?', rateLimit.public, publicController.verifyByCodeFlexible);

export default router;