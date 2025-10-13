import * as customerController from '../controllers/customer';
import express from 'express';
import verifyToken from '../middlewares/verifyToken';

const router = express.Router();

router.post('/create_customer', verifyToken, customerController.createCustomerController);
router.delete('/delete_customer/:customerId', verifyToken, customerController.deleteCustomerController);
router.get('/list_customers', verifyToken, customerController.listCustomersController);
router.get('/customer_detail/:customerId', verifyToken, customerController.getCustomerDetailController);
router.get('/my_customers', verifyToken, customerController.getCustomerOfUserController);
router.get('/search', verifyToken, customerController.searchCustomerByNameController);
export default router;