import express from 'express';
import { 
  createOrder, 
  getUserOrders, 
  getOrderDetails, 
  cancelOrder 
} from '../controllers/orderController';

const router = express.Router();

router.post('/create', createOrder);
router.get('/user/:userId', getUserOrders);
router.get('/:orderId', getOrderDetails);
router.put('/:orderId/cancel', cancelOrder);

export default router;