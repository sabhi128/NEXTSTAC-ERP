import express from 'express';
import * as inventoryController from '../controllers/inventoryController.js';
import { verifySupabaseToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all inventory routes with JWT authentication
router.use(verifySupabaseToken);

router.get('/products', inventoryController.getProducts);
router.post('/products', inventoryController.createProduct);
router.put('/products/:id', inventoryController.updateProduct); // Using PUT/PATCH
router.delete('/products', inventoryController.deleteAllProducts);
router.delete('/products/:id', inventoryController.deleteProduct);

// Stock Movement Routes
router.get('/stock-movements', inventoryController.getStockMovements);
router.post('/stock-movements', inventoryController.addStockMovement);
router.put('/stock-movements/:id', inventoryController.updateStockMovement);
router.delete('/stock-movements', inventoryController.deleteAllStockMovements);
router.delete('/stock-movements/:id', inventoryController.deleteStockMovement);

export default router;
