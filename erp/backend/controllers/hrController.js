import dbAdapter from '../dbAdapter.js';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../supabaseClient.js';

export const getAllEmployees = async (req, res) => {
    try {
        const rows = await dbAdapter.hr.getAllEmployees();
        let employees = rows.map(r => ({
            id: r.id,
            firstName: r.first_name || r.firstName,
            lastName: r.last_name || r.lastName,
            email: r.email,
            position: r.position,
            department: r.department_name || r.department,
            salary: r.salary,
            status: r.status,
            avatar: r.avatar_url || r.avatar,
            phone: r.phone,
            address: r.address,
            joinDate: r.join_date || r.joinDate,
            updatedAt: r.updated_at || r.updatedAt,
            stipendType: r.stipend_type || r.stipendType,
            stipendDescription: r.stipend_description || r.stipendDescription,
            cnicFront: r.cnic_front || r.cnicFront,
            cnicBack: r.cnic_back || r.cnicBack,
            matricResult: r.matric_result || r.matricResult,
            interResult: r.inter_result || r.interResult,
            cv: r.cv,
            promotionLevel: r.promotion_level || r.promotionLevel
        }));

        const userRole = (req.user?.role || 'user').toLowerCase();

        if (userRole === 'ecommerce_admin') {
            employees = employees.filter(e => e.department === 'E-commerce');
        } else if (userRole === 'dev_admin') {
            employees = employees.filter(e => e.department === 'Web Development');
        }

        res.json(employees);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getEmployeeById = async (req, res) => {
    try {
        const row = await dbAdapter.hr.getEmployeeById(req.params.id);
        if (!row) return res.status(404).json({ error: 'Employee not found' });

        const employee = {
            id: row.id,
            firstName: row.first_name || row.firstName,
            lastName: row.last_name || row.lastName,
            email: row.email,
            position: row.position,
            department: row.department_name || row.department,
            salary: row.salary,
            stipendType: row.stipend_type || row.stipendType,
            status: row.status,
            avatar: row.avatar_url || row.avatar,
            phone: row.phone,
            address: row.address,
            joinDate: row.join_date || row.joinDate,
            updatedAt: row.updated_at || row.updatedAt,
            promotionLevel: row.promotion_level || row.promotionLevel
        };
        res.json(employee);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const createEmployee = async (req, res) => {
    try {
        const { firstName, lastName, email, position, department, salary, promotionLevel, stipendType, stipendDescription, status, avatar, phone, address, cnic } = req.body;
        const id = uuidv4(); // Employee ID
        const joinDate = new Date().toISOString();

        // Handle File Uploads
        const files = req.files || {};
        const getFileUrl = (fieldName) => {
            if (files[fieldName] && files[fieldName][0]) {
                const file = files[fieldName][0];
                return file.filename ? `/uploads/${file.filename}` : null;
            }
            return null;
        };

        const cnicFront = getFileUrl('cnic_front');
        const cnicBack = getFileUrl('cnic_back');
        const matricResult = getFileUrl('matric_result');
        const interResult = getFileUrl('inter_result');
        const cv = getFileUrl('cv');

        const newEmpPayload = {
            id, firstName, lastName, email, position, department, salary,
            stipendType, stipendDescription,
            status: status || 'Active', avatar, phone, address, cnic, joinDate,
            cnicFront, cnicBack, matricResult, interResult, cv, promotionLevel
        };

        // 1. Create Employee Record
        const savedEmp = await dbAdapter.hr.createEmployee(newEmpPayload);

        // 2. Auto-Create User Account (Login Access)
        // Check if user already exists to avoid duplicates/errors
        const existingUser = await dbAdapter.findUserByEmail(email);

        if (!existingUser) {
            const userPassword = cnic || '12345678'; // Default to CNIC or fallback
            let userId = uuidv4(); // Default new ID
            let userHash = 'PENDING_REGISTRATION';

            // Create in Supabase Auth
            if (supabaseAdmin) {
                const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                    email,
                    password: userPassword,
                    email_confirm: true,
                    user_metadata: { name: `${firstName} ${lastName}` }
                });

                if (authError) {
                    console.error('Failed to auto-create Auth user for employee:', authError);
                } else if (authData.user) {
                    userId = authData.user.id;
                    userHash = 'SUPABASE_AUTH';
                }
            }

            // Create in Local Users Table
            const newUser = {
                id: userId,
                name: `${firstName} ${lastName}`,
                email,
                password_hash: userHash,
                role: 'staff',
                status: 'Active',
                department: department
            };

            await dbAdapter.createUser(newUser);
            console.log(`Auto-created user account for employee: ${email}`);
        }

        res.status(201).json(savedEmp);
    } catch (err) {
        console.error('Create Employee Error:', err);
        if (err.message && (err.message.includes('SQLITE_CONSTRAINT') || err.message.includes('unique constraint'))) {
            return res.status(400).json({ error: 'Employee with this email already exists' });
        }
        res.status(500).json({ error: err.message });
    }
};

export const updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Handle File Uploads (Merge into updates)
        const files = req.files || {};
        const getFileUrl = (fieldName) => {
            if (files[fieldName] && files[fieldName][0]) {
                const file = files[fieldName][0];
                return file.filename ? `/uploads/${file.filename}` : null;
            }
            return null;
        };

        const cnicFront = getFileUrl('cnic_front');
        if (cnicFront) updates.cnicFront = cnicFront;

        const cnicBack = getFileUrl('cnic_back');
        if (cnicBack) updates.cnicBack = cnicBack;

        const matricResult = getFileUrl('matric_result');
        if (matricResult) updates.matricResult = matricResult;

        const interResult = getFileUrl('inter_result');
        if (interResult) updates.interResult = interResult;

        const cv = getFileUrl('cv');
        if (cv) updates.cv = cv;

        if (updates.promotionLevel) updates.promotionLevel = updates.promotionLevel;

        const updatedEmp = await dbAdapter.hr.updateEmployee(id, updates);
        res.json(updatedEmp);
    } catch (err) {
        console.error('Update Employee Error:', err);
        res.status(500).json({ error: err.message });
    }
};

export const deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        await dbAdapter.hr.deleteEmployee(id);
        res.json({ success: true, message: 'Employee deleted' });
    } catch (err) {
        console.error('Delete Employee Error:', err);
        res.status(500).json({ error: err.message });
    }
};

// --- Leave Management ---

export const getAllLeaves = async (req, res) => {
    try {
        const [leaveRows, employeeRows] = await Promise.all([
            dbAdapter.hr.getAllLeaves(),
            dbAdapter.hr.getAllEmployees()
        ]);

        // Map employee ID to department for filtering
        const empMap = {};
        employeeRows.forEach(emp => {
            empMap[emp.id] = emp.department_name || emp.department;
        });

        let leaves = leaveRows.map(leave => ({
            id: leave.id,
            employeeId: leave.employee_id || leave.employeeId,
            employeeName: leave.employee_name || leave.employeeName,
            department: empMap[leave.employee_id || leave.employeeId] || 'Unassigned',
            type: leave.type,
            startDate: leave.start_date || leave.startDate,
            endDate: leave.end_date || leave.endDate,
            days: Math.ceil((new Date(leave.end_date || leave.endDate) - new Date(leave.start_date || leave.startDate)) / (1000 * 60 * 60 * 24)) + 1,
            reason: leave.reason,
            status: leave.status,
            requestedOn: leave.created_at || leave.createdAt,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(leave.employee_name || leave.employeeName)}&background=random`
        }));

        const userRole = (req.user?.role || 'user').toLowerCase();
        console.log('DEBUG getAllLeaves:', { user: req.user, rawRole: req.user?.role, normalizedRole: userRole });

        // 1. Employees: See only OWN requests
        if (userRole !== 'super_admin' && !userRole.includes('admin')) {
            console.log('DEBUG: Treating as Employee');
            const employee = await dbAdapter.hr.getEmployeeByEmail(req.user.email);
            if (employee) {
                leaves = leaves.map(l => ({ ...l, employeeId: l.employeeId })); // Ensure structure matches
                leaves = leaves.filter(l => l.employeeId === employee.id);
            } else {
                console.log('DEBUG: Employee record not found for email:', req.user.email);
                leaves = [];
            }
        }
        // 2. E-commerce Admin
        else if (userRole === 'ecommerce_admin') {
            console.log('DEBUG: Treating as Ecommerce Admin');
            leaves = leaves.filter(l => l.department === 'E-commerce');
        }
        // 3. Web Dev Admin
        else if (userRole === 'dev_admin') {
            console.log('DEBUG: Treating as Dev Admin');
            leaves = leaves.filter(l => l.department === 'Web Development');
        }
        // 4. Super Admin: Sees EVERYTHING
        else {
            console.log('DEBUG: Treating as Super Admin (Access All)');
        }

        res.json(leaves);
    } catch (err) {
        console.error('Get All Leaves Error:', err);
        res.status(500).json({ error: err.message });
    }
};

export const createLeave = async (req, res) => {
    const { type, startDate, endDate, reason } = req.body;

    let targetEmployeeId = req.body.employeeId;
    let targetEmployeeName = req.body.employeeName;

    try {
        if (req.user && req.user.email) {
            const employee = await dbAdapter.hr.getEmployeeByEmail(req.user.email);
            if (employee) {
                targetEmployeeId = employee.id;
                targetEmployeeName = `${employee.first_name || employee.firstName} ${employee.last_name || employee.lastName}`;
            } else if (!targetEmployeeId) {
                return res.status(404).json({ error: "No employee record found for your account. Please contact HR." });
            }
        }

        if (!targetEmployeeId) {
            return res.status(400).json({ error: "Employee identification failed." });
        }

        const id = uuidv4();
        const leavePayload = {
            id,
            employeeId: targetEmployeeId,
            employeeName: targetEmployeeName || 'Unknown',
            type,
            startDate,
            endDate,
            reason
        };

        await dbAdapter.hr.createLeave(leavePayload);
        res.status(201).json({ id, status: 'Pending', message: 'Leave requested successfully' });
    } catch (err) {
        console.error('Create Leave Error:', err);
        res.status(500).json({ error: err.message });
    }
};

export const updateLeaveStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        const result = await dbAdapter.hr.updateLeaveStatus(id, status);
        res.json(result);
    } catch (err) {
        console.error('Update Leave Status Error:', err);
        res.status(500).json({ error: err.message });
    }
};
// --- Attendance ---

export const getAllAttendance = async (req, res) => {
    try {
        let attendance = await dbAdapter.hr.getAllAttendance();

        // Transform if necessary (dbAdapter keys might be mixed camel/snake depending on adapter version, 
        // but our new adapter code strictly returns camelCase for SQLite and snake_case mostly for Supabase 
        // unless we map it. Let's inspect dbAdapter return... 
        // dbAdapter SQLite returns: employeeId, employeeName... (camelCase)
        // dbAdapter Supabase returns: raw rows (snake_case).
        // WE NEED TO NORMALIZE HERE to camelCase for Frontend.

        attendance = attendance.map(a => ({
            id: a.id,
            employeeId: a.employee_id || a.employeeId,
            employeeName: a.employee_name || a.employeeName,
            date: a.date,
            checkIn: a.check_in || a.checkIn,
            checkOut: a.check_out || a.checkOut,
            status: a.status,
            workHours: a.work_hours || a.workHours,
            createdAt: a.created_at || a.createdAt
        }));

        const userRole = (req.user?.role || 'user').toLowerCase();
        console.log('DEBUG getAllAttendance:', {
            email: req.user?.email,
            role: req.user?.role,
            normalizedRole: userRole,
            totalRecordsFetched: attendance?.length
        });

        // Filter for Non-Admins
        if (userRole !== 'super_admin' && !userRole.includes('admin')) {
            console.log('DEBUG: Filtering for Employee view');
            const employee = await dbAdapter.hr.getEmployeeByEmail(req.user.email);
            if (employee) {
                attendance = attendance.filter(r => r.employeeId === employee.id);
            } else {
                console.log('DEBUG: No employee record found for user');
                attendance = [];
            }
        }

        res.json(attendance);
    } catch (err) {
        console.error('Get Attendance Error:', err);
        res.status(500).json({ error: err.message });
    }
};

export const getEmployeeHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const history = await dbAdapter.hr.getEmployeeHistory(id);
        res.json(history);
    } catch (err) {
        console.error("Get History Error:", err);
        res.status(500).json({ error: err.message });
    }
};

export const createAttendance = async (req, res) => {
    try {
        const userRole = (req.user?.role || 'user').toLowerCase();
        if (userRole !== 'super_admin' && !userRole.includes('admin')) {
            return res.status(403).json({ error: 'Unauthorized: Only Admins can manually add attendance' });
        }

        const { employeeId, employeeName, date, checkIn, checkOut, status, workHours } = req.body;
        const id = uuidv4();

        const record = {
            id,
            employeeId,
            employeeName,
            date,
            checkIn,
            checkOut,
            status: status || 'Present',
            workHours
        };

        await dbAdapter.hr.createAttendance(record);
        res.status(201).json(record);

    } catch (err) {
        console.error('Create Attendance Error:', err);
        res.status(500).json({ error: err.message });
    }
};

export const updateAttendance = async (req, res) => {
    try {
        const userRole = (req.user?.role || 'user').toLowerCase();
        if (userRole !== 'super_admin' && !userRole.includes('admin')) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const { id } = req.params;
        const updates = req.body;

        const result = await dbAdapter.hr.updateAttendance(id, updates);
        res.json(result);

    } catch (err) {
        console.error('Update Attendance Error:', err);
        res.status(500).json({ error: err.message });
    }
};
