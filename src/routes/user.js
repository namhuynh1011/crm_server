import express from 'express';
import * as userController from '../controllers/user';
import verifyRole from '../middlewares/verifyRole';
import verifyToken from '../middlewares/verifyToken';
const router = express.Router();

router.get('/getall', verifyToken, verifyRole('admin'), userController.getAllUsersController);
router.get('/get/:id', verifyToken, verifyRole('admin'), userController.getUserByIdController);
router.delete('/delete/:id', verifyToken, verifyRole('admin'), userController.deleteUserController);
router.put('/block/:id', verifyToken, verifyRole('admin'), userController.blockUserController);
router.post('/create', verifyToken, verifyRole('admin'), userController.createUserController);
router.put('/update/profile/', verifyToken, userController.updateUserController);
export default router;