import express from 'express';
import * as crmController from '../controllers/crmController.js';
import { verifySupabaseToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all CRM routes with JWT authentication
router.use(verifySupabaseToken);

router.get('/customers', crmController.getCustomers);
router.post('/customers', crmController.createCustomer);
router.put('/customers/:id', crmController.updateCustomer);
router.delete('/customers/all', crmController.deleteAllCustomers);
router.delete('/customers/:id', crmController.deleteCustomer);

// Leads
router.get('/leads', crmController.getLeads);
router.post('/leads', crmController.createLead);
router.put('/leads/:id', crmController.updateLead);
router.delete('/leads/all', crmController.deleteAllLeads);
router.delete('/leads/:id', crmController.deleteLead);

// Follow-ups
router.get('/followups', crmController.getFollowUps);
router.post('/followups', crmController.createFollowUp);
router.put('/followups/:id', crmController.updateFollowUp);
router.delete('/followups/all', crmController.deleteAllFollowUps);
router.delete('/followups/:id', crmController.deleteFollowUp);

export default router;
