import express from 'express';
import { getOrders, createOrder, deleteAllOrders } from '../controllers/salesController.js';
import { verifySupabaseToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all sales routes with JWT authentication
router.use(verifySupabaseToken);

router.get('/orders', getOrders);
router.post('/orders', createOrder);
router.delete('/orders/all', deleteAllOrders);

export default router;
