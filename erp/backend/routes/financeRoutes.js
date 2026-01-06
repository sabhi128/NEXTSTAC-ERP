import express from 'express';
import * as financeController from '../controllers/financeController.js';
import { verifySupabaseToken } from '../middleware/authMiddleware.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Protect all finance routes with JWT authentication
router.use(verifySupabaseToken);

// Upload Excel
router.post('/upload', upload.single('file'), financeController.uploadFinanceData);

// Transactions
router.get('/transactions', financeController.getTransactions);

// Invoices
router.get('/invoices', financeController.getInvoices);
router.post('/invoices', financeController.createInvoice);
router.patch('/invoices/:id/status', financeController.updateInvoiceStatus); // Using PATCH for status updates
router.delete('/invoices/:id', financeController.deleteInvoice);

// Payments
router.get('/payments', financeController.getPayments);
router.post('/payments', financeController.createPayment);
router.patch('/payments/:id/status', financeController.updatePaymentStatus);
router.patch('/payments/:id', financeController.updatePayment);
router.delete('/payments/:id', financeController.deletePayment);

export default router;
