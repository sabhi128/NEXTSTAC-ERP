import express from 'express';
import * as hrController from '../controllers/hrController.js';
import { upload } from '../controllers/documentController.js';
import { verifySupabaseToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all HR routes with JWT authentication
router.use(verifySupabaseToken);

router.get('/employees', hrController.getAllEmployees);
router.get('/employees/:id', hrController.getEmployeeById);
router.get('/employees/:id/history', hrController.getEmployeeHistory);
const employeeUploads = upload.fields([
    { name: 'cnic_front', maxCount: 1 },
    { name: 'cnic_back', maxCount: 1 },
    { name: 'matric_result', maxCount: 1 },
    { name: 'inter_result', maxCount: 1 },
    { name: 'cv', maxCount: 1 }
]);

router.post('/employees', employeeUploads, hrController.createEmployee);
router.put('/employees/:id', employeeUploads, hrController.updateEmployee);
router.delete('/employees/:id', hrController.deleteEmployee);

// Leaves
router.get('/leaves', hrController.getAllLeaves);
router.post('/leaves', hrController.createLeave);
router.put('/leaves/:id/status', hrController.updateLeaveStatus);
router.delete('/leaves/:id', hrController.deleteLeave);

// Attendance
router.get('/attendance', hrController.getAllAttendance);
router.post('/attendance', hrController.createAttendance);
router.put('/attendance/:id', hrController.updateAttendance);

export default router;
