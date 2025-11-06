import * as RequestController from '../controllers/request.js';
import express from 'express';
import verifiToken from '../middlewares/verifyToken.js'
import verifyRole from '../middlewares/verifyRole.js';
const router = express.Router();

router.post('/create', RequestController.createRequestController);
router.post(
    '/assign/:id/agent',
    verifiToken,
    verifyRole('manager'),
    RequestController.assignRequestToEmployeeController
);

export default router;
