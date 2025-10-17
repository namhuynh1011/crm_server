import express from 'express';
import verifyToken from '../middlewares/verifyToken.js';
import { uploadSinglePdf } from '../middlewares/uploadPDF.js';
import * as contractController from '../controllers/contract.js';

const router = express.Router();

// verifyToken trước, uploadSinglePdf middleware (đã là function) sau
router.post('/', verifyToken, uploadSinglePdf, contractController.createContractHandler);

export default router;