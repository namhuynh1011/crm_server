import express from 'express';
import verifyToken from '../middlewares/verifyToken';
import * as authController from '../controllers/auth';
import verifyRole from '../middlewares/verifyRole';
const router = express.Router();

router.post('/register', verifyToken, verifyRole('admin'), authController.registerController)
router.post('/login', authController.loginController)
router.put('/change-password', verifyToken, authController.changePasswordController)
router.put('/update/profile/', verifyToken, authController.updateUserController);
router.get('/me', verifyToken, authController.getUserByIdController);
export default router;