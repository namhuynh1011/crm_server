import express from 'express';
import * as authController from '../controllers/auth';

const router = express.Router();

router.post('/register', authController.registerController)

export default router;