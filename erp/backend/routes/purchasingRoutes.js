import express from 'express';
import * as purchasingController from '../controllers/purchasingController.js';
import { verifySupabaseToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all purchasing routes with JWT authentication
router.use(verifySupabaseToken);

router.get('/vendors', purchasingController.getVendors);
router.post('/vendors', purchasingController.createVendor);
router.put('/vendors/:id', purchasingController.updateVendor);
router.delete('/vendors/all', purchasingController.deleteAllVendors);
router.delete('/vendors/:id', purchasingController.deleteVendor);

// Purchase Orders
router.get('/purchase-orders', purchasingController.getPurchaseOrders);
router.post('/purchase-orders', purchasingController.createPurchaseOrder);
router.put('/purchase-orders/:id', purchasingController.updatePurchaseOrder);
router.delete('/purchase-orders/all', purchasingController.deleteAllPurchaseOrders);
router.delete('/purchase-orders/:id', purchasingController.deletePurchaseOrder);

// Bills
router.get('/bills', purchasingController.getBills);
router.post('/bills', purchasingController.createBill);
router.put('/bills/:id', purchasingController.updateBill);
router.delete('/bills/all', purchasingController.deleteAllBills);
router.delete('/bills/:id', purchasingController.deleteBill);

export default router;
