import express from 'express';
import { getOrders, createOrder } from '../controllers/salesController.js';
import { verifySupabaseToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all sales routes with JWT authentication
router.use(verifySupabaseToken);

router.get('/orders', getOrders);
router.post('/orders', createOrder);
router.delete('/orders/all', (req, res) => {
    // Import controller dynamically or assume it's exported.
    // Wait, I didn't export it in the import statement above.
    // I should update the import first.
    // Or just use the controller function reference if I update the import.
    // I will update the import in a separate step or just inline it if keeping it simple, but better to follow pattern.
    import('../controllers/salesController.js').then(c => c.deleteAllOrders(req, res));
});

export default router;
