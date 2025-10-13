import express from 'express';
import verifyToken from '../middlewares/verifyToken';
import upload from '../middlewares/uploadPDF';
import * as contractController from '../controllers/contract';

const router = express.Router();

router.post('/create', verifyToken, upload.single('pdf'), contractController.createContractController);

export default router;