import db from './db.js';
import supabaseAnon, { supabaseAdmin } from './supabaseClient.js';

// Fallback to Anon client if Admin (Service Role) is missing.
// Note: Anon client is subject to RLS and might fail if policies don't allow access.
const supabase = supabaseAdmin || supabaseAnon;

const isVercel = process.env.VERCEL === '1' || (!!process.env.VITE_SUPABASE_URL && process.env.NODE_ENV === 'production');

const dbAdapter = {
    // --- User Operations ---

    // Find User By Email
    findUserByEmail: async (email) => {
        if (isVercel) {
            if (!supabase) throw new Error('Supabase client not initialized (Missing Env Vars)');
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 is 'Row not found'
                throw new Error(error.message);
            }
            return data || null;
        } else {
            return new Promise((resolve, reject) => {
                db.get("SELECT * FROM users WHERE email = ?", [email], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
        }
    },

    // Get All Users
    getAllUsers: async () => {
        if (isVercel) {
            if (!supabase) throw new Error('Supabase client not initialized');
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw new Error(error.message);
            return data;
        } else {
            return new Promise((resolve, reject) => {
                db.all("SELECT * FROM users ORDER BY created_at DESC", [], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
        }
    },

    // Create User (Invite)
    createUser: async (user) => {
        if (isVercel) {
            if (!supabase) throw new Error('Supabase client not initialized (Missing Env Vars)');
            // Map camelCase to snake_case if necessary, schema seems mixed but let's stick to what authController passed
            // The authController passes object keys that map to DB columns? 
            // SQLite Insert was: id, name, email, password_hash, role, status, department
            const { error } = await supabase
                .from('users')
                .insert([user]);

            if (error) throw new Error(error.message);
            return user;
        } else {
            return new Promise((resolve, reject) => {
                const stmt = db.prepare("INSERT INTO users (id, name, email, password_hash, role, status, department) VALUES (?, ?, ?, ?, ?, ?, ?)");
                stmt.run(user.id, user.name, user.email, user.password_hash, user.role, user.status, user.department, function (err) {
                    if (err) reject(err);
                    else resolve(user);
                });
                stmt.finalize();
            });
        }
    },

    // Update User (Register/Activate)
    updateUser: async (id, updates) => {
        if (isVercel) {
            if (!supabase) throw new Error('Supabase client not initialized (Missing Env Vars)');
            const { error } = await supabase
                .from('users')
                .update(updates)
                .eq('id', id);

            if (error) throw new Error(error.message);
            return { id, ...updates }; // Return mocked updated object (simplification)
        } else {
            return new Promise((resolve, reject) => {
                // Determine what to update dynamically or specific fields?
                // authController updates: name, password_hash, status
                const keys = Object.keys(updates);
                const values = Object.values(updates);
                const setClause = keys.map(k => `${k} = ?`).join(', ');

                const stmt = db.prepare(`UPDATE users SET ${setClause} WHERE id = ?`);
                stmt.run(...values, id, function (err) {
                    if (err) reject(err);
                    else resolve({ id, ...updates });
                });
                stmt.finalize();
            });
        }
    },

    // Find User By ID
    findUserById: async (id) => {
        if (isVercel) {
            if (!supabase) throw new Error('Supabase client not initialized (Missing Env Vars)');
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw new Error(error.message);
            return data;
        } else {
            return new Promise((resolve, reject) => {
                db.get("SELECT * FROM users WHERE id = ?", [id], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
        }
    },

    // Delete User
    deleteUser: async (id) => {
        if (isVercel) {
            if (!supabase) throw new Error('Supabase client not initialized (Missing Env Vars)');
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', id);

            if (error) throw new Error(error.message);
            return true;
        } else {
            return new Promise((resolve, reject) => {
                db.run("DELETE FROM users WHERE id = ?", [id], (err) => {
                    if (err) reject(err);
                    else resolve(true);
                });
            });
        }
    },

    // --- Settings / Config ---
    getSetting: async (key) => {
        if (isVercel) {
            if (!supabase) return null; // Safe fail
            const { data, error } = await supabase.from('settings').select('value').eq('key', key).single();
            if (error) return null;
            return data?.value;
        } else {
            return new Promise((resolve, reject) => {
                // Return null if table missing or error (safe fail for SQLite if migration not run)
                db.get("SELECT value FROM settings WHERE key = ?", [key], (err, row) => {
                    if (err) resolve(null); // Resolve null on error (e.g. no table)
                    else resolve(row ? row.value : null);
                });
            });
        }
    },

    setSetting: async (key, value) => {
        const valStr = String(value);
        if (isVercel) {
            if (!supabase) throw new Error('Supabase client not initialized');
            const { error } = await supabase.from('settings').upsert({ key, value: valStr });
            if (error) throw new Error(error.message);
        } else {
            return new Promise((resolve, reject) => {
                db.run("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", [key, valStr], (err) => {
                    if (err) reject(err); else resolve();
                });
            });
        }
    }
};

// --- HR Operations ---
dbAdapter.hr = {
    // Employees
    getAllEmployees: async () => {
        if (isVercel) {
            if (!supabase) throw new Error('Supabase client not initialized');
            const { data, error } = await supabase.from('employees').select('*').order('created_at', { ascending: false });
            if (error) throw new Error(error.message);
            // Map snake_case to camelCase
            return data.map(emp => ({
                id: emp.id,
                firstName: emp.first_name,
                lastName: emp.last_name,
                email: emp.email,
                position: emp.position,
                department: emp.department_name,
                salary: emp.salary,
                stipendType: emp.stipend_type,
                stipendDescription: emp.stipend_description,
                status: emp.status,
                avatar: emp.avatar_url,
                phone: emp.phone,
                address: emp.address,
                joinDate: emp.join_date,
                cnicFront: emp.cnic_front,
                cnicBack: emp.cnic_back,
                matricResult: emp.matric_result,
                interResult: emp.inter_result,
                cv: emp.cv,
                promotionLevel: emp.promotion_level,
                updatedAt: emp.updated_at
            }));
        } else {
            return new Promise((resolve, reject) => {
                try { fs.appendFileSync('debug_db.log', `[${new Date().toISOString()}] getAllEmployees called\n`); } catch (e) { }
                db.all(`SELECT id, first_name as firstName, last_name as lastName, email, position, department_name as department, salary, status, avatar_url as avatar, phone, address, join_date as joinDate, updated_at as updatedAt, stipend_type as stipendType, stipend_description as stipendDescription, cnic_front as cnicFront, cnic_back as cnicBack, matric_result as matricResult, inter_result as interResult, cv, promotion_level as promotionLevel FROM employees ORDER BY created_at DESC`, [], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
        }
    },

    getEmployeeByEmail: async (email) => {
        if (isVercel) {
            if (!supabase) throw new Error('Supabase client not initialized');
            const { data, error } = await supabase.from('employees').select('*').eq('email', email).single();
            // Allow null if not found, don't throw unless it's a real error
            if (error && error.code !== 'PGRST116') throw new Error(error.message);
            return data;
        } else {
            return new Promise((resolve, reject) => {
                db.get("SELECT * FROM employees WHERE email = ?", [email], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
        }
    },

    getEmployeeById: async (id) => {
        if (isVercel) {
            const { data, error } = await supabase.from('employees').select('*').eq('id', id).single();
            if (error) throw new Error(error.message);
            // Map snake_case to camelCase
            return {
                id: data.id,
                firstName: data.first_name,
                lastName: data.last_name,
                email: data.email,
                position: data.position,
                department: data.department_name,
                salary: data.salary,
                stipendType: data.stipend_type,
                stipendDescription: data.stipend_description,
                status: data.status,
                avatar: data.avatar_url,
                phone: data.phone,
                address: data.address,
                joinDate: data.join_date,
                cnicFront: data.cnic_front,
                cnicBack: data.cnic_back,
                matricResult: data.matric_result,
                interResult: data.inter_result,
                cv: data.cv,
                promotionLevel: data.promotion_level,
                updatedAt: data.updated_at
            };
        } else {
            return new Promise((resolve, reject) => {
                db.get(`SELECT id, first_name as firstName, last_name as lastName, email, position, department_name as department, salary, status, avatar_url as avatar, phone, address, join_date as joinDate, updated_at as updatedAt FROM employees WHERE id = ?`, [id], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
        }
    },

    createEmployee: async (emp) => {
        if (isVercel) {
            // Unmap camelCase to snake_case for DB is handled by Supabase IF column names match, or we mapped them manually?
            // The schema in db.js uses snake_case (first_name), but Supabase usually matches JSON keys if columns are same.
            // Let's assume we need to map OR the frontend/controller sends matching keys.
            // hrController sends: id, firstName, lastName...
            // better to map explicitly to be safe
            const dbPayload = {
                id: emp.id,
                first_name: emp.firstName,
                last_name: emp.lastName,
                email: emp.email,
                position: emp.position,
                department_name: emp.department,
                salary: emp.salary,
                stipend_type: emp.stipendType,
                stipend_description: emp.stipendDescription,
                status: emp.status,
                avatar_url: emp.avatar,
                phone: emp.phone,
                address: emp.address,
                join_date: emp.joinDate,
                cnic_front: emp.cnicFront,
                cnic_back: emp.cnicBack,
                matric_result: emp.matricResult,
                inter_result: emp.interResult,
                cv: emp.cv
            };
            const { error } = await supabase.from('employees').insert([dbPayload]);
            if (error) throw new Error(error.message);
            return emp;
        } else {
            return new Promise((resolve, reject) => {
                const sql = "INSERT INTO employees (id, first_name, last_name, email, position, department_name, salary, stipend_type, stipend_description, status, avatar_url, phone, address, join_date, cnic_front, cnic_back, matric_result, inter_result, cv, promotion_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                const params = [emp.id, emp.firstName, emp.lastName, emp.email, emp.position, emp.department, emp.salary, emp.stipendType, emp.stipendDescription, emp.status, emp.avatar, emp.phone, emp.address, emp.joinDate, emp.cnicFront, emp.cnicBack, emp.matricResult, emp.interResult, emp.cv, emp.promotionLevel];

                db.run(sql, params, function (err) {
                    if (err) reject(err);
                    else resolve(emp);
                });
            });
        }
    },

    updateEmployee: async (id, updates) => {
        // Map frontend keys to DB keys
        const dbUpdates = {};
        if (updates.firstName) dbUpdates.first_name = updates.firstName;
        if (updates.lastName) dbUpdates.last_name = updates.lastName;
        if (updates.email) dbUpdates.email = updates.email;
        if (updates.position) dbUpdates.position = updates.position;
        if (updates.department) dbUpdates.department_name = updates.department;
        if (updates.salary) dbUpdates.salary = updates.salary;
        if (updates.promotionLevel) dbUpdates.promotion_level = updates.promotionLevel;
        if (updates.stipendType) dbUpdates.stipend_type = updates.stipendType;
        if (updates.stipendDescription) dbUpdates.stipend_description = updates.stipendDescription;
        if (updates.status) dbUpdates.status = updates.status;
        if (updates.avatar) dbUpdates.avatar_url = updates.avatar;
        if (updates.phone) dbUpdates.phone = updates.phone;
        if (updates.address) dbUpdates.address = updates.address;
        if (updates.cnicFront) dbUpdates.cnic_front = updates.cnicFront;
        if (updates.cnicBack) dbUpdates.cnic_back = updates.cnicBack;
        if (updates.matricResult) dbUpdates.matric_result = updates.matricResult;
        if (updates.interResult) dbUpdates.inter_result = updates.interResult;
        if (updates.cv) dbUpdates.cv = updates.cv;

        dbUpdates.updated_at = new Date().toISOString();

        if (isVercel) {
            if (!supabase) throw new Error('Supabase client not initialized');

            // 1. Fetch Old Data for History
            const { data: oldEmp, error: fetchError } = await supabase
                .from('employees')
                .select('*')
                .eq('id', id)
                .single();

            if (fetchError) console.error("Error fetching old employee data:", fetchError);

            // 2. Perform Update
            const { data, error } = await supabase.from('employees').update(dbUpdates).eq('id', id).select();
            if (error) throw new Error(error.message);

            // 3. Compare and Insert History
            if (oldEmp) {
                const changes = [];
                // Check Position/Department/Salary/Level
                // Note: dbUpdates keys are snake_case, updates keys are camelCase. 
                // We compare updates.position vs oldEmp.position
                if (updates.position && updates.position !== oldEmp.position) changes.push('position');
                if (updates.promotionLevel && updates.promotionLevel !== oldEmp.promotion_level) changes.push('level');
                if (updates.salary && String(updates.salary) !== String(oldEmp.salary)) changes.push('salary');
                if (updates.department && updates.department !== oldEmp.department_name) changes.push('department');

                if (changes.length > 0) {
                    const historyPayload = {
                        employee_id: id,
                        old_position: oldEmp.position,
                        old_level: oldEmp.promotion_level,
                        old_salary: oldEmp.salary,
                        old_department: oldEmp.department_name,
                        new_position: updates.position || oldEmp.position,
                        new_level: updates.promotionLevel || oldEmp.promotion_level,
                        new_salary: updates.salary || oldEmp.salary,
                        new_department: updates.department || oldEmp.department_name,
                        changed_by: updates.updatedBy || 'System'
                    };
                    const { error: historyError } = await supabase.from('employee_history').insert([historyPayload]);
                    if (historyError) console.error("Supabase History Insert Error:", historyError);
                }
            }

            return data[0];
        } else {
            // ... SQLite Implementation (Keeping existing logic for local dev) ...
            // --- HISTORY TRACKING ---
            // Before updating, check if critical fields changed.
            try {
                if (!isVercel) {
                    const oldEmp = await new Promise((resolve) => {
                        db.get(`SELECT * FROM employees WHERE id = ?`, [id], (err, row) => resolve(row));
                    });

                    if (oldEmp) {
                        const changes = [];
                        if (updates.position && updates.position !== oldEmp.position) changes.push('position');
                        if (updates.promotionLevel && updates.promotionLevel !== oldEmp.promotion_level) changes.push('level');
                        if (updates.salary && String(updates.salary) !== String(oldEmp.salary)) changes.push('salary');
                        if (updates.department && updates.department !== oldEmp.department_name) changes.push('department');

                        if (changes.length > 0) {
                            const { v4: uuidv4 } = await import('uuid');
                            const historyId = uuidv4();
                            const changeDate = new Date().toISOString();
                            const changedBy = updates.updatedBy || 'System';

                            await new Promise((resolve, reject) => {
                                db.run(`INSERT INTO employee_history 
                                    (id, employee_id, old_position, old_level, old_salary, old_department, new_position, new_level, new_salary, new_department, change_date, changed_by)
                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                    [
                                        historyId, id, oldEmp.position, oldEmp.promotion_level, oldEmp.salary, oldEmp.department_name,
                                        updates.position || oldEmp.position, updates.promotionLevel || oldEmp.promotion_level, updates.salary || oldEmp.salary, updates.department || oldEmp.department_name,
                                        changeDate, changedBy
                                    ],
                                    (err) => {
                                        if (err) console.error("History Insert Error:", err);
                                        resolve();
                                    }
                                );
                            });
                        }
                    }
                }
            } catch (e) {
                console.error("History Tracking Error:", e);
            }

            // Generate dynamic SQL for SQLite
            const keys = Object.keys(dbUpdates);
            const values = Object.values(dbUpdates);
            const setClause = keys.map(k => `${k} = ?`).join(', ');

            return new Promise((resolve, reject) => {
                db.run(`UPDATE employees SET ${setClause} WHERE id = ?`, [...values, id], function (err) {
                    if (err) reject(err);
                    else resolve({ id, ...updates });
                });
            });
        }
    },

    getEmployeeHistory: async (id) => {
        if (isVercel) {
            if (!supabase) throw new Error('Supabase client not initialized');
            const { data, error } = await supabase
                .from('employee_history')
                .select('*')
                .eq('employee_id', id)
                .order('change_date', { ascending: false });

            if (error) throw new Error(error.message);
            return data;
        } else {
            return new Promise((resolve, reject) => {
                db.all(`SELECT * FROM employee_history WHERE employee_id = ? ORDER BY change_date DESC`, [id], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
        }
    },

    deleteEmployee: async (id) => {
        if (isVercel) {
            if (!supabase) throw new Error('Supabase client not initialized');
            const { error } = await supabase.from('employees').delete().eq('id', id);
            if (error) throw new Error(error.message);
            return { success: true };
        } else {
            return new Promise((resolve, reject) => {
                db.run("DELETE FROM employees WHERE id = ?", [id], function (err) {
                    if (err) reject(err);
                    else resolve({ success: true });
                });
            });
        }
    },

    deleteAllEmployees: async () => {
        if (isVercel) {
            if (!supabase) throw new Error('Supabase client not initialized');
            const client = supabaseAdmin || supabase;
            // Delete all by matching a condition that is always true
            const { error } = await client.from('employees').delete().gte('created_at', '1900-01-01');
            if (error) throw new Error(error.message);
            return { success: true };
        } else {
            return new Promise((resolve, reject) => {
                db.run("DELETE FROM employees", [], function (err) {
                    if (err) reject(err);
                    else resolve({ success: true });
                });
            });
        }
    },

    // Leaves
    getAllLeaves: async () => {
        if (isVercel) {
            const { data, error } = await supabase.from('leaves').select('*').order('created_at', { ascending: false });
            if (error) throw new Error(error.message);
            return data.map(l => ({
                id: l.id,
                employeeId: l.employee_id,
                employeeName: l.employee_name,
                type: l.type,
                startDate: l.start_date,
                endDate: l.end_date,
                reason: l.reason,
                status: l.status,
                createdAt: l.created_at
            }));
        } else {
            return new Promise((resolve, reject) => {
                db.all("SELECT * FROM leaves ORDER BY created_at DESC", [], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
        }
    },

    createLeave: async (leave) => {
        if (isVercel) {
            const payload = {
                id: leave.id,
                employee_id: leave.employeeId,
                employee_name: leave.employeeName,
                type: leave.type,
                start_date: leave.startDate,
                end_date: leave.endDate,
                reason: leave.reason
            };
            const { error } = await supabase.from('leaves').insert([payload]);
            if (error) throw new Error(error.message);
            return leave;
        } else {
            return new Promise((resolve, reject) => {
                const stmt = db.prepare("INSERT INTO leaves (id, employee_id, employee_name, type, start_date, end_date, reason) VALUES (?, ?, ?, ?, ?, ?, ?)");
                stmt.run(leave.id, leave.employeeId, leave.employeeName, leave.type, leave.startDate, leave.endDate, leave.reason, function (err) {
                    if (err) reject(err);
                    else resolve(leave);
                });
                stmt.finalize();
            });
        }
    },

    updateLeaveStatus: async (id, status) => {
        if (isVercel) {
            const { error } = await supabase.from('leaves').update({ status }).eq('id', id);
            if (error) throw new Error(error.message);
            return { id, status };
        } else {
            return new Promise((resolve, reject) => {
                db.run("UPDATE leaves SET status = ? WHERE id = ?", [status, id], function (err) {
                    if (err) reject(err);
                    else resolve({ id, status });
                });
            });
        }
    },

    deleteLeave: async (id) => {
        if (isVercel) {
            const { error } = await supabase.from('leaves').delete().eq('id', id);
            if (error) throw new Error(error.message);
            return { success: true };
        } else {
            return new Promise((resolve, reject) => {
                db.run("DELETE FROM leaves WHERE id = ?", [id], function (err) {
                    if (err) reject(err);
                    else resolve({ success: true });
                });
            });
        }
    },

    deleteAllLeaves: async () => {
        if (isVercel) {
            const client = supabaseAdmin || supabase;
            const { error } = await client.from('leaves').delete().gte('created_at', '1900-01-01');
            if (error) throw new Error(error.message);
            return { success: true };
        } else {
            return new Promise((resolve, reject) => {
                db.run("DELETE FROM leaves", [], function (err) {
                    if (err) reject(err);
                    else resolve({ success: true });
                });
            });
        }
    },

    // Attendance
    getAllAttendance: async () => {
        if (isVercel) {
            const { data, error } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
            if (error) throw new Error(error.message);
            return data.map(a => ({
                id: a.id,
                employeeId: a.employee_id,
                employeeName: a.employee_name,
                date: a.date,
                checkIn: a.check_in,
                checkOut: a.check_out,
                status: a.status,
                workHours: a.work_hours,
                createdAt: a.created_at
            }));
        } else {
            return new Promise((resolve, reject) => {
                db.all("SELECT id, employee_id as employeeId, employee_name as employeeName, date, check_in as checkIn, check_out as checkOut, status, work_hours as workHours, created_at as createdAt FROM attendance ORDER BY created_at DESC", [], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
        }
    },

    createAttendance: async (record) => {
        if (isVercel) {
            const payload = {
                id: record.id,
                employee_id: record.employeeId,
                employee_name: record.employeeName,
                date: record.date,
                check_in: record.checkIn,
                check_out: record.checkOut,
                status: record.status,
                work_hours: record.workHours
            };
            const { error } = await supabase.from('attendance').insert([payload]);
            if (error) throw new Error(error.message);
            return record;
        } else {
            return new Promise((resolve, reject) => {
                const sql = "INSERT INTO attendance (id, employee_id, employee_name, date, check_in, check_out, status, work_hours) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
                db.run(sql, [record.id, record.employeeId, record.employeeName, record.date, record.checkIn, record.checkOut, record.status, record.workHours], function (err) {
                    if (err) reject(err);
                    else resolve(record);
                });
            });
        }
    },

    updateAttendance: async (id, updates) => {
        if (isVercel) {
            const mapped = {};
            // Explicitly allow only editable fields and map them to snake_case
            if (updates.checkIn !== undefined) mapped.check_in = updates.checkIn;
            if (updates.checkOut !== undefined) mapped.check_out = updates.checkOut;
            if (updates.status !== undefined) mapped.status = updates.status;
            if (updates.workHours !== undefined) mapped.work_hours = updates.workHours;
            if (updates.date !== undefined) mapped.date = updates.date;

            // Ignore other fields like employeeName, employeeId to prevent schema errors

            if (Object.keys(mapped).length === 0) return { id, ...updates }; // No valid updates

            const { error } = await supabase.from('attendance').update(mapped).eq('id', id);
            if (error) throw new Error(error.message);
            return { id, ...updates };
        } else {
            return new Promise((resolve, reject) => {
                const keys = Object.keys(updates);
                if (keys.length === 0) return resolve({});

                const fields = keys.map((key) => {
                    if (key === 'checkIn') return 'check_in = ?';
                    if (key === 'checkOut') return 'check_out = ?';
                    if (key === 'workHours') return 'work_hours = ?';
                    return `${key} = ?`;
                });

                const values = keys.map(k => updates[k]);
                values.push(id);

                const sql = `UPDATE attendance SET ${fields.join(', ')} WHERE id = ?`;
                db.run(sql, values, function (err) {
                    if (err) reject(err);
                    else resolve({ id, ...updates });
                });
            });
        }
    },

    deleteAttendance: async (id) => {
        if (isVercel) {
            const { error } = await supabase.from('attendance').delete().eq('id', id);
            if (error) throw new Error(error.message);
            return { success: true };
        } else {
            return new Promise((resolve, reject) => {
                db.run("DELETE FROM attendance WHERE id = ?", [id], function (err) {
                    if (err) reject(err);
                    else resolve({ success: true });
                });
            });
        }
    },

    deleteAllAttendance: async () => {
        if (isVercel) {
            const client = supabaseAdmin || supabase;
            const { error } = await client.from('attendance').delete().gte('created_at', '1900-01-01');
            if (error) throw new Error(error.message);
            return { success: true };
        } else {
            return new Promise((resolve, reject) => {
                db.run("DELETE FROM attendance", [], function (err) {
                    if (err) reject(err);
                    else resolve({ success: true });
                });
            });
        }
    },

    // Salaries (Payroll)
    getSalaries: async () => {
        if (isVercel) {
            const { data, error } = await supabase.from('salaries').select('*').order('created_at', { ascending: false });
            if (error) throw new Error(error.message);
            return data.map(s => ({
                id: s.id,
                employeeId: s.employee_id,
                employeeName: s.employee_name,
                amount: s.amount,
                paymentDate: s.payment_date,
                status: s.status,
                method: s.method
            }));
        } else {
            return new Promise((resolve, reject) => {
                db.all("SELECT * FROM salaries ORDER BY created_at DESC", [], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows.map(s => ({
                        id: s.id,
                        employeeId: s.employee_id,
                        employeeName: s.employee_name,
                        amount: s.amount,
                        paymentDate: s.payment_date,
                        status: s.status,
                        method: s.method
                    })));
                });
            });
        }
    },

    createSalary: async (salary) => {
        if (isVercel) {
            const client = supabaseAdmin || supabase;
            const { error } = await client.from('salaries').insert([{
                id: salary.id,
                employee_id: salary.employeeId,
                employee_name: salary.employeeName,
                amount: salary.amount,
                payment_date: salary.paymentDate,
                status: salary.status,
                method: salary.method
            }]);
            if (error) throw new Error(error.message);
            return salary;
        } else {
            return new Promise((resolve, reject) => {
                db.run("INSERT INTO salaries (id, employee_id, employee_name, amount, payment_date, status, method) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    [salary.id, salary.employeeId, salary.employeeName, salary.amount, salary.paymentDate, salary.status, salary.method],
                    function (err) {
                        if (err) reject(err);
                        else resolve(salary);
                    });
            });
        }
    },

    updateSalary: async (id, updates) => {
        if (isVercel) {
            const client = supabaseAdmin || supabase;
            const dbUpdates = {};
            if (updates.status) dbUpdates.status = updates.status;
            // Add mapping for other fields if needed

            const { error } = await client.from('salaries').update(dbUpdates).eq('id', id);
            if (error) throw new Error(error.message);
            return { id, ...updates };
        } else {
            return new Promise((resolve, reject) => {
                const keys = Object.keys(updates);
                if (keys.length === 0) return resolve({ id });

                // Map frontend keys to DB keys for SQLite
                const dbKeys = keys.map(k => {
                    if (k === 'paymentDate') return 'payment_date';
                    if (k === 'employeeId') return 'employee_id';
                    if (k === 'employeeName') return 'employee_name';
                    return k;
                });

                const values = Object.values(updates);
                values.push(id);

                const setClause = dbKeys.map((k, i) => `${k} = ?`).join(', ');

                db.run(`UPDATE salaries SET ${setClause} WHERE id = ?`, values, function (err) {
                    if (err) reject(err);
                    else resolve({ id, ...updates });
                });
            });
        }
    },

    deleteAllSalaries: async () => {
        if (isVercel) {
            const client = supabaseAdmin || supabase;
            const { error } = await client.from('salaries').delete().gte('created_at', '1900-01-01');
            if (error) throw new Error(error.message);
            return { success: true };
        } else {
            return new Promise((resolve, reject) => {
                db.run("DELETE FROM salaries", [], function (err) {
                    if (err) reject(err);
                    else resolve({ success: true });
                });
            });
        }
    }
};

// --- Inventory Operations ---
dbAdapter.inventory = {
    getProducts: async () => {
        if (isVercel) {
            const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
            if (error) throw new Error(error.message);
            return data.map(p => ({
                id: p.id,
                name: p.name,
                sku: p.sku,
                category: p.category,
                price: p.price,
                stock: p.stock,
                minStock: p.min_stock,
                supplier: p.supplier,
                status: p.status,
                lastUpdated: p.last_updated
            }));
        } else {
            return new Promise((resolve, reject) => {
                db.all(`SELECT id, name, sku, category, price, stock, min_stock as minStock, supplier, status, last_updated as lastUpdated FROM products ORDER BY created_at DESC`, [], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
        }
    },

    findProductByName: async (name) => {
        if (isVercel) {
            const { data, error } = await supabase.from('products').select('*').eq('name', name).single();
            if (error && error.code !== 'PGRST116') throw new Error(error.message);
            return data;
        } else {
            return new Promise((resolve, reject) => {
                db.get("SELECT * FROM products WHERE name = ?", [name], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
        }
    },

    findProductByName: async (name) => {
        if (isVercel) {
            const { data, error } = await supabase.from('products').select('*').eq('name', name).single();
            if (error && error.code !== 'PGRST116') throw new Error(error.message);
            return data;
        } else {
            return new Promise((resolve, reject) => {
                db.get("SELECT * FROM products WHERE name = ?", [name], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
        }
    },

    createProduct: async (product) => {
        if (isVercel) {
            const payload = {
                id: product.id,
                name: product.name,
                sku: product.sku,
                category: product.category,
                price: product.price,
                stock: product.stock,
                min_stock: product.minStock,
                warehouse: product.warehouse,
                supplier: product.supplier,
                status: product.status,
                last_updated: product.lastUpdated
            };
            const { error } = await supabase.from('products').insert([payload]);
            if (error) throw new Error(error.message);
            return product;
        } else {
            return new Promise((resolve, reject) => {
                const stmt = db.prepare("INSERT INTO products (id, name, sku, category, price, stock, min_stock, warehouse, supplier, status, last_updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                stmt.run(product.id, product.name, product.sku, product.category, product.price, product.stock, product.minStock, product.warehouse, product.supplier, product.status, product.lastUpdated, function (err) {
                    if (err) reject(err);
                    else resolve(product);
                });
                stmt.finalize();
            });
        }
    },

    updateProduct: async (id, updates) => {
        if (isVercel) {
            const mappedUpdates = {};
            for (const [key, val] of Object.entries(updates)) {
                if (key === 'minStock') mappedUpdates.min_stock = val;
                else if (key === 'lastUpdated') mappedUpdates.last_updated = val;
                else mappedUpdates[key] = val;
            }

            const { error } = await supabase.from('products').update(mappedUpdates).eq('id', id);
            if (error) throw new Error(error.message);
            const { data } = await supabase.from('products').select('*').eq('id', id).single();
            return data;
        } else {
            return new Promise((resolve, reject) => {
                const keys = Object.keys(updates);
                if (keys.length === 0) return resolve({});

                const fields = keys.map((key) => {
                    let col = key;
                    if (key === 'minStock') col = 'min_stock';
                    if (key === 'lastUpdated') col = 'last_updated';
                    return `${col} = ?`;
                });
                const values = keys.map(k => updates[k]);
                values.push(id);

                const sql = `UPDATE products SET ${fields.join(', ')} WHERE id = ?`;
                db.run(sql, values, function (err) {
                    if (err) reject(err);
                    else {
                        db.get("SELECT id, name, sku, category, price, stock, min_stock as minStock, supplier, status, last_updated as lastUpdated FROM products WHERE id = ?", [id], (err, row) => resolve(row));
                    }
                });
            });
        }
    },

    deleteProduct: async (id) => {
        if (isVercel) {
            // Cascade delete movements first
            await supabase.from('stock_movements').delete().eq('product_id', id);
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) throw new Error(error.message);
            return true;
        } else {
            return new Promise((resolve, reject) => {
                db.serialize(() => {
                    db.run("DELETE FROM stock_movements WHERE product_id = ?", [id]);
                    db.run("DELETE FROM products WHERE id = ?", [id], (err) => {
                        if (err) reject(err);
                        else resolve(true);
                    });
                });
            });
        }
    },
    deleteAllProducts: async () => {
        if (isVercel) {
            // Cascade delete: Remove all stock movements first to avoid FK violation
            const { error: smError } = await supabase.from('stock_movements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            if (smError) console.error("Error deleting stock movements during product wipe:", smError);

            const { error } = await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            if (error) throw new Error(error.message);
            return true;
        } else {
            return new Promise((resolve, reject) => {
                db.serialize(() => {
                    db.run("DELETE FROM stock_movements");
                    db.run("DELETE FROM products", [], (err) => {
                        if (err) reject(err);
                        else resolve(true);
                    });
                });
            });
        }
    },

    deleteAllStockMovements: async () => {
        if (isVercel) {
            const { error } = await supabase.from('stock_movements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            if (error) throw new Error(error.message);
            return true;
        } else {
            return new Promise((resolve, reject) => {
                db.run("DELETE FROM stock_movements", [], (err) => {
                    if (err) reject(err);
                    else resolve(true);
                });
            });
        }
    },

    getStockMovements: async () => {
        if (isVercel) {
            const { data, error } = await supabase
                .from('stock_movements')
                .select(`
                    *,
                    products ( name )
                `)
                .order('date', { ascending: false });

            if (error) throw new Error(error.message);

            return data.map(m => ({
                ...m,
                product_name: m.products?.name,
                products: undefined
            }));
        } else {
            return new Promise((resolve, reject) => {
                const sql = `
                    SELECT sm.*, p.name as product_name
                    FROM stock_movements sm
                    LEFT JOIN products p ON sm.product_id = p.id
                    ORDER BY sm.date DESC
                `;
                db.all(sql, [], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
        }
    },

    addStockMovement: async (movement) => {
        if (isVercel) {
            const payload = {
                id: movement.id,
                product_id: movement.productId,
                type: movement.type,
                quantity: movement.quantity,
                warehouse: movement.warehouse,
                reference_code: movement.reference,
                reason: movement.reason,
                date: movement.date
            };
            const { error } = await supabase.from('stock_movements').insert([payload]);
            if (error) throw new Error(error.message);
            return movement;
        } else {
            return new Promise((resolve, reject) => {
                const stmt = db.prepare("INSERT INTO stock_movements (id, product_id, type, quantity, warehouse, reference_code, reason, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
                stmt.run(movement.id, movement.productId, movement.type, movement.quantity, movement.warehouse, movement.reference, movement.reason, movement.date, function (err) {
                    if (err) reject(err);
                    else resolve(movement);
                });
                stmt.finalize();
            });
        }
    },

    updateStockMovement: async (id, updates) => {
        if (isVercel) {
            const mappedUpdates = {};
            if (updates.productId) mappedUpdates.product_id = updates.productId;
            if (updates.type) mappedUpdates.type = updates.type;
            if (updates.quantity) mappedUpdates.quantity = updates.quantity;
            if (updates.warehouse) mappedUpdates.warehouse = updates.warehouse;
            if (updates.reference) mappedUpdates.reference_code = updates.reference;
            if (updates.notes) mappedUpdates.reason = updates.notes;
            if (updates.reason) mappedUpdates.reason = updates.reason;
            if (updates.date) mappedUpdates.date = updates.date;

            const { error } = await supabase.from('stock_movements').update(mappedUpdates).eq('id', id);
            if (error) throw new Error(error.message);
            return { id, ...updates };
        } else {
            return new Promise((resolve, reject) => {
                const fields = [];
                const values = [];

                if (updates.productId !== undefined) { fields.push('product_id = ?'); values.push(updates.productId); }
                if (updates.type !== undefined) { fields.push('type = ?'); values.push(updates.type); }
                if (updates.quantity !== undefined) { fields.push('quantity = ?'); values.push(updates.quantity); }
                if (updates.warehouse !== undefined) { fields.push('warehouse = ?'); values.push(updates.warehouse); }
                if (updates.reference !== undefined) { fields.push('reference_code = ?'); values.push(updates.reference); }
                if (updates.notes !== undefined) { fields.push('reason = ?'); values.push(updates.notes); }
                if (updates.reason !== undefined && updates.notes === undefined) { fields.push('reason = ?'); values.push(updates.reason); }
                if (updates.date !== undefined) { fields.push('date = ?'); values.push(updates.date); }

                if (fields.length === 0) return resolve({});

                values.push(id);
                const sql = `UPDATE stock_movements SET ${fields.join(', ')} WHERE id = ?`;

                db.run(sql, values, function (err) {
                    if (err) reject(err);
                    else resolve({ id, ...updates });
                });
            });
        }
    },

    deleteStockMovement: async (id) => {
        if (isVercel) {
            const { error } = await supabase.from('stock_movements').delete().eq('id', id);
            if (error) throw new Error(error.message);
            return true;
        } else {
            return new Promise((resolve, reject) => {
                db.run("DELETE FROM stock_movements WHERE id = ?", [id], (err) => {
                    if (err) reject(err);
                    else resolve(true);
                });
            });
        }
    },

    // --- Warehouses ---
    getWarehouses: async () => {
        if (isVercel) {
            // Sort by name or ID, as created_at might not exist
            const { data, error } = await supabase.from('warehouses').select('*').neq('status', 'Deleted').order('name', { ascending: true });
            if (error) throw new Error(error.message);
            return data;
        } else {
            return new Promise((resolve, reject) => {
                db.all(`SELECT * FROM warehouses ORDER BY created_at DESC`, [], (err, rows) => {
                    if (err) resolve([]); // Table might not exist yet
                    else resolve(rows);
                });
            });
        }
    },
    addWarehouse: async (warehouse) => {
        if (isVercel) {
            const payload = {
                id: warehouse.id,
                name: warehouse.name,
                location: warehouse.location,
                capacity: warehouse.capacity,
                status: warehouse.status
            };
            const { error } = await supabase.from('warehouses').insert([payload]);
            if (error) throw new Error(error.message);
            return warehouse;
        } else {
            return new Promise((resolve, reject) => {
                const sql = `INSERT INTO warehouses (id, name, location, capacity, status) VALUES (?, ?, ?, ?, ?)`;
                db.run(sql, [warehouse.id, warehouse.name, warehouse.location, warehouse.capacity, warehouse.status], function (err) {
                    if (err) reject(err);
                    else resolve(warehouse);
                });
            });
        }
    },
    updateWarehouse: async (id, updates) => {
        if (isVercel) {
            const { error } = await supabase.from('warehouses').update(updates).eq('id', id);
            if (error) throw new Error(error.message);
            return { id, ...updates };
        } else {
            return new Promise((resolve, reject) => {
                const keys = Object.keys(updates);
                if (keys.length === 0) return resolve({});
                const fields = keys.map(k => `${k} = ?`).join(', ');
                const values = keys.map(k => updates[k]);
                values.push(id);
                db.run(`UPDATE warehouses SET ${fields} WHERE id = ?`, values, function (err) {
                    if (err) reject(err);
                    else resolve({ id, ...updates });
                });
            });
        }
    },
    deleteWarehouse: async (id) => {
        if (isVercel) {
            const { error } = await supabase.from('warehouses').delete().eq('id', id);
            if (error) throw new Error(error.message);
            return true;
        } else {
            return new Promise((resolve, reject) => {
                db.run("DELETE FROM warehouses WHERE id = ?", [id], (err) => {
                    if (err) reject(err);
                    else resolve(true);
                });
            });
        }
    },
    deleteAllWarehouses: async () => {
        if (isVercel) {
            const { error } = await supabase.from('warehouses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            if (error) throw new Error(error.message);
            return true;
        } else {
            return new Promise((resolve, reject) => {
                db.run("DELETE FROM warehouses", [], (err) => {
                    if (err) reject(err);
                    else resolve(true);
                });
            });
        }
    }
};



// --- Finance Operations ---
dbAdapter.finance = {
    // Accounts
    getAccounts: async () => {
        if (isVercel) {
            const { data, error } = await supabase.from('finance_accounts').select('*').order('name', { ascending: true });
            if (error) {
                console.error('Error fetching finance_accounts:', error.message);
                throw new Error(error.message); // Throw so controller handles it (500)
            }
            return (data || []).map(a => ({
                id: a.id,
                name: a.name,
                type: a.type,
                category: a.category,
                normalBalance: a.normal_balance,
                description: a.description
            }));
        } else {
            return new Promise((resolve, reject) => {
                db.all(`SELECT id, name, type, category, normal_balance as normalBalance, description FROM finance_accounts ORDER BY name ASC`, [], (err, rows) => {
                    if (err) resolve([]); // Fallback
                    else resolve(rows);
                });
            });
        }
    },

    seedAccounts: async (accounts) => {
        if (isVercel) {
            // Upsert accounts
            const payload = accounts.map(a => ({
                id: a.id,
                name: a.name,
                type: a.type,
                category: a.category,
                normal_balance: a.normalBalance,
                description: a.description
            }));
            const { error } = await supabase.from('finance_accounts').upsert(payload);
            if (error) throw new Error(error.message);
            return true;
        } else {
            return new Promise((resolve, reject) => {
                const placeholders = accounts.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
                const values = [];
                accounts.forEach(a => {
                    values.push(a.id, a.name, a.type, a.category, a.normalBalance, a.description);
                });
                // This acts as a simple insert, might need delete all first or conflict handling
                db.serialize(() => {
                    db.run("DELETE FROM finance_accounts");
                    db.run(`INSERT INTO finance_accounts (id, name, type, category, normal_balance, description) VALUES ${placeholders}`, values, (err) => {
                        if (err) reject(err);
                        else resolve(true);
                    });
                });
            });
        }
    },

    // Transactions
    getTransactions: async () => {
        if (isVercel) {
            const { data, error } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
            if (error) throw new Error(error.message);
            return data.map(t => ({
                id: t.id,
                date: t.date,
                description: t.description,
                amount: t.amount,
                type: t.type,
                category: t.category,
                reference: t.reference
            }));
        } else {
            return new Promise((resolve, reject) => {
                db.all(`SELECT id, date, description, amount, type, category, reference FROM transactions ORDER BY created_at DESC`, [], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
        }
    },
    createTransactions: async (transactions) => {
        if (!transactions || transactions.length === 0) return [];

        if (isVercel) {
            const payload = transactions.map(t => ({
                id: t.id,
                date: t.date,
                description: t.description,
                amount: t.amount,
                type: t.type,
                category: t.category,
                reference: t.reference
            }));
            const { data, error } = await supabase.from('transactions').insert(payload);
            if (error) throw new Error(error.message);
            return payload;
        } else {
            return new Promise((resolve, reject) => {
                const placeholders = transactions.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ');
                const values = [];
                transactions.forEach(t => {
                    values.push(t.id, t.date, t.description, t.amount, t.type, t.category, t.reference);
                });
                const sql = `INSERT INTO transactions (id, date, description, amount, type, category, reference) VALUES ${placeholders}`;
                db.run(sql, values, function (err) {
                    if (err) reject(err);
                    else resolve(transactions);
                });
            });
        }
    },

    deleteAllTransactions: async () => {
        if (isVercel) {
            const client = supabaseAdmin || supabase;
            const { error } = await client.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            if (error) throw new Error(error.message);
            return true;
        } else {
            return new Promise((resolve, reject) => {
                db.run("DELETE FROM transactions", [], (err) => {
                    if (err) reject(err);
                    else resolve(true);
                });
            });
        }
    },

    getInvoices: async () => {
        if (isVercel) {
            const { data, error } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
            if (error) throw new Error(error.message);
            return data.map(i => ({
                id: i.id,
                invoiceNumber: i.invoice_number,
                customer: i.customer_name,
                date: i.date,
                dueDate: i.due_date,
                amount: i.amount,
                status: i.status,
                items: i.items_count // Controller expects 'items' for count? No, schema says items_count -> items (in SQLite query)
            }));
        } else {
            return new Promise((resolve, reject) => {
                db.all(`SELECT id, invoice_number as invoiceNumber, customer_name as customer, date, due_date as dueDate, amount, status, items_count as items FROM invoices ORDER BY created_at DESC`, [], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
        }
    },

    createInvoice: async (invoice, items) => {
        if (isVercel) {
            const invPayload = {
                id: invoice.id,
                invoice_number: invoice.invoiceNumber,
                customer_name: invoice.customer,
                date: invoice.date,
                due_date: invoice.dueDate,
                amount: invoice.amount,
                status: invoice.status,
                items_count: invoice.itemsCount
            };

            const { error: invError } = await supabase.from('invoices').insert([invPayload]);
            if (invError) throw new Error(invError.message);
            // Invoice items skipped for Supabase mvp as table missing or complex, matches previous logic
            return invoice;
        } else {
            return new Promise((resolve, reject) => {
                const sql = `INSERT INTO invoices (id, invoice_number, customer_name, date, due_date, amount, status, items_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
                db.run(sql, [invoice.id, invoice.invoiceNumber, invoice.customer, invoice.date, invoice.dueDate, invoice.amount, invoice.status, invoice.itemsCount], function (err) {
                    if (err) reject(err);
                    else resolve(invoice);
                });
            });
        }
    },

    updateInvoice: async (id, updates) => {
        // Define allowed columns and their mapping from frontend keys
        const mapField = (key, val) => {
            if (key === 'invoiceNumber') return ['invoice_number', val];
            if (key === 'customer') return ['customer_name', val];
            if (key === 'dueDate') return ['due_date', val];
            if (key === 'itemsCount') return ['items_count', val];
            if (key === 'totalAmount') return ['amount', val]; // Map totalAmount to amount
            if (key === 'amount') return ['amount', val];
            if (key === 'date') return ['date', val];
            if (key === 'status') return ['status', val];
            // If items is passed, update count if we can, otherwise ignore array
            if (key === 'items' && Array.isArray(val)) return ['items_count', val.length];

            return null; // Ignore other fields like cashDiscount, subtotal etc.
        };

        const mapped = {};
        for (const [key, val] of Object.entries(updates)) {
            const result = mapField(key, val);
            if (result) {
                const [dbCol, dbVal] = result;
                mapped[dbCol] = dbVal;
            }
        }

        if (Object.keys(mapped).length === 0) return { id, ...updates };

        if (isVercel) {
            const { error } = await supabase.from('invoices').update(mapped).eq('id', id);
            if (error) throw new Error(error.message);
            return { id, ...updates };
        } else {
            return new Promise((resolve, reject) => {
                const keys = Object.keys(mapped);
                const values = Object.values(mapped);
                const fields = keys.map(k => `${k} = ?`);
                values.push(id);

                const sql = `UPDATE invoices SET ${fields.join(', ')} WHERE id = ?`;
                db.run(sql, values, function (err) {
                    if (err) reject(err);
                    else resolve({ id, ...updates });
                });
            });
        }
    },

    updateInvoiceStatus: async (id, status) => {
        if (isVercel) {
            const { error } = await supabase.from('invoices').update({ status }).eq('id', id);
            if (error) throw new Error(error.message);
            return { id, status };
        } else {
            return new Promise((resolve, reject) => {
                db.run("UPDATE invoices SET status = ? WHERE id = ?", [status, id], function (err) {
                    if (err) reject(err);
                    else resolve({ id, status });
                });
            });
        }
    },

    deleteInvoice: async (id) => {
        if (isVercel) {
            const { error } = await supabase.from('invoices').delete().eq('id', id);
            if (error) throw new Error(error.message);
            return true;
        } else {
            return new Promise((resolve, reject) => {
                db.run("DELETE FROM invoices WHERE id = ?", [id], (err) => {
                    if (err) reject(err);
                    else resolve(true);
                });
            });
        }
    },

    deleteAllInvoices: async () => {
        if (isVercel) {
            const { error } = await supabase.from('invoices').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
            if (error) throw new Error(error.message);
            return true;
        } else {
            return new Promise((resolve, reject) => {
                db.run("DELETE FROM invoices", [], (err) => {
                    if (err) reject(err);
                    else resolve(true);
                });
            });
        }
    },

    getPayments: async () => {
        if (isVercel) {
            const { data, error } = await supabase.from('payments').select('*').order('created_at', { ascending: false });
            if (error) throw new Error(error.message);
            return data.map(p => ({
                id: p.id,
                paymentNumber: p.payment_number,
                vendor: p.vendor,
                amount: p.amount,
                date: p.date,
                method: p.method,
                status: p.status
            }));
        } else {
            return new Promise((resolve, reject) => {
                db.all(`SELECT id, payment_number as paymentNumber, vendor, amount, date, method, status FROM payments ORDER BY created_at DESC`, [], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
        }
    },

    createPayment: async (payment) => {
        if (isVercel) {
            const payload = {
                id: payment.id,
                payment_number: payment.paymentNumber,
                vendor: payment.vendor,
                amount: payment.amount,
                date: payment.date,
                method: payment.method,
                status: payment.status
            };
            const { error } = await supabase.from('payments').insert([payload]);
            if (error) throw new Error(error.message);
            return payment;
        } else {
            return new Promise((resolve, reject) => {
                const sql = `INSERT INTO payments (id, payment_number, vendor, amount, date, method, status) VALUES (?, ?, ?, ?, ?, ?, ?)`;
                db.run(sql, [payment.id, payment.paymentNumber, payment.vendor, payment.amount, payment.date, payment.method, payment.status], function (err) {
                    if (err) reject(err);
                    else resolve(payment);
                });
            });
        }
    },

    updatePaymentStatus: async (id, status) => {
        if (isVercel) {
            const { error } = await supabase.from('payments').update({ status }).eq('id', id);
            if (error) throw new Error(error.message);
            return { id, status };
        } else {
            return new Promise((resolve, reject) => {
                db.run(`UPDATE payments SET status = ? WHERE id = ?`, [status, id], function (err) {
                    if (err) reject(err);
                    else resolve({ id, status });
                });
            });
        }
    },

    deleteAllPayments: async () => {
        if (isVercel) {
            const { error } = await supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
            if (error) throw new Error(error.message);
            return true;
        } else {
            return new Promise((resolve, reject) => {
                db.run("DELETE FROM payments", [], (err) => {
                    if (err) reject(err);
                    else resolve(true);
                });
            });
        }
    },

    deletePayment: async (id) => {
        if (isVercel) {
            const { error } = await supabase.from('payments').delete().eq('id', id);
            if (error) throw new Error(error.message);
            return true;
        } else {
            return new Promise((resolve, reject) => {
                db.run("DELETE FROM payments WHERE id = ?", [id], (err) => {
                    if (err) reject(err);
                    else resolve(true);
                });
            });
        }
    },

    updatePayment: async (id, updates) => {
        if (isVercel) {
            const mapped = {};
            for (const [key, val] of Object.entries(updates)) {
                if (key === 'paymentNumber') mapped.payment_number = val;
                else mapped[key] = val;
            }
            const { error } = await supabase.from('payments').update(mapped).eq('id', id);
            if (error) throw new Error(error.message);
            return { id, ...updates };
        } else {
            return new Promise((resolve, reject) => {
                const keys = Object.keys(updates);
                if (keys.length === 0) return resolve({});
                const fields = keys.map((key) => {
                    if (key === 'paymentNumber') return 'payment_number = ?';
                    return `${key} = ?`;
                });
                const values = keys.map(k => updates[k]);
                values.push(id);
                db.run(`UPDATE payments SET ${fields.join(', ')} WHERE id = ?`, values, function (err) {
                    if (err) reject(err);
                    else resolve({ id, ...updates });
                });
            });
        }
    }
};

// --- CRM Operations ---
dbAdapter.crm = {
    getCustomers: async () => {
        if (isVercel) {
            const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
            if (error) throw new Error(error.message);
            return data.map(c => ({
                id: c.id,
                name: c.name,
                company: c.company,
                email: c.email,
                phone: c.phone,
                address: c.address,
                status: c.status,
                notes: c.notes,
                totalOrders: c.total_orders,
                lastOrderDate: c.last_order_date
            }));
        } else {
            return new Promise((resolve, reject) => {
                db.all(`SELECT id, name, company, email, phone, address, status, notes, total_orders as totalOrders, last_order_date as lastOrderDate FROM customers ORDER BY created_at DESC`, [], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
        }
    },
    createCustomer: async (customer) => {
        if (isVercel) {
            const payload = {
                id: customer.id,
                name: customer.name,
                company: customer.company,
                email: customer.email,
                phone: customer.phone,
                address: customer.address,
                status: customer.status,
                notes: customer.notes
            };
            const { error } = await supabase.from('customers').insert([payload]);
            if (error) throw new Error(error.message);
            return { ...customer, totalOrders: 0 };
        } else {
            return new Promise((resolve, reject) => {
                const sql = `INSERT INTO customers (id, name, company, email, phone, address, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
                db.run(sql, [customer.id, customer.name, customer.company, customer.email, customer.phone, customer.address, customer.status, customer.notes], function (err) {
                    if (err) reject(err);
                    else resolve({ ...customer, totalOrders: 0 });
                });
            });
        }
    },
    updateCustomer: async (id, updates) => {
        if (isVercel) {
            const mapped = {};
            for (const [key, val] of Object.entries(updates)) {
                if (key === 'totalOrders') mapped.total_orders = val;
                else if (key === 'lastOrderDate') mapped.last_order_date = val;
                else mapped[key] = val;
            }
            const { error } = await supabase.from('customers').update(mapped).eq('id', id);
            if (error) throw new Error(error.message);
            const { data } = await supabase.from('customers').select('*').eq('id', id).single();
            return data;
        } else {
            return new Promise((resolve, reject) => {
                const keys = Object.keys(updates);
                if (keys.length === 0) return resolve({});
                const fields = keys.map((key) => {
                    let col = key;
                    if (key === 'totalOrders') col = 'total_orders';
                    if (key === 'lastOrderDate') col = 'last_order_date';
                    return `${col} = ?`;
                });
                const values = keys.map(k => updates[k]);
                values.push(id);
                const sql = `UPDATE customers SET ${fields.join(', ')} WHERE id = ?`;
                db.run(sql, values, function (err) {
                    if (err) reject(err);
                    else {
                        db.get("SELECT id, name, company, email, phone, address, status, notes, total_orders as totalOrders, last_order_date as lastOrderDate FROM customers WHERE id = ?", [id], (err, row) => resolve(row));
                    }
                });
            });
        }
    },
    deleteCustomer: async (id) => {
        if (isVercel) {
            const { error } = await supabase.from('customers').delete().eq('id', id);
            if (error) throw new Error(error.message);
            return true;
        } else {
            return new Promise((resolve, reject) => {
                db.run("DELETE FROM customers WHERE id = ?", [id], (err) => {
                    if (err) reject(err);
                    else resolve(true);
                });
            });
        }
    },
    deleteAllCustomers: async () => {
        if (isVercel) {
            const { error } = await supabase.from('customers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            if (error) throw new Error(error.message);
            return true;
        } else {
            return new Promise((resolve, reject) => {
                db.run("DELETE FROM customers", [], (err) => {
                    if (err) reject(err);
                    else resolve(true);
                });
            });
        }
    },
    getLeads: async () => {
        if (isVercel) {
            const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
            if (error) throw new Error(error.message);
            return data;
        } else {
            return new Promise((resolve, reject) => {
                db.all(`SELECT * FROM leads ORDER BY created_at DESC`, [], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
        }
    },
    createLead: async (lead) => {
        if (isVercel) {
            const payload = {
                id: lead.id,
                name: lead.name,
                company: lead.company,
                email: lead.email,
                phone: lead.phone,
                source: lead.source,
                status: lead.status,
                estimated_value: lead.estimatedValue
            };
            const { error } = await supabase.from('leads').insert([payload]);
            if (error) throw new Error(error.message);
            return lead;
        } else {
            return new Promise((resolve, reject) => {
                const sql = `INSERT INTO leads (id, name, company, email, phone, source, status, estimated_value) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
                db.run(sql, [lead.id, lead.name, lead.company, lead.email, lead.phone, lead.source, lead.status, lead.estimatedValue], function (err) {
                    if (err) reject(err);
                    else resolve(lead);
                });
            });
        }
    },
    updateLead: async (id, updates) => {
        if (isVercel) {
            const mapped = {};
            for (const [key, val] of Object.entries(updates)) {
                if (key === 'estimatedValue' || key === 'value') mapped.estimated_value = val;
                else mapped[key] = val;
            }
            const { error } = await supabase.from('leads').update(mapped).eq('id', id);
            if (error) throw new Error(error.message);
            return { id, ...updates };
        } else {
            return new Promise((resolve, reject) => {
                const keys = Object.keys(updates);
                if (keys.length === 0) return resolve({});
                const fields = keys.map((key) => {
                    if (key === 'estimatedValue' || key === 'value') return 'estimated_value = ?';
                    return `${key} = ?`;
                });
                const values = keys.map(k => updates[k]);
                values.push(id);
                const sql = `UPDATE leads SET ${fields.join(', ')} WHERE id = ?`;
                db.run(sql, values, function (err) {
                    if (err) reject(err);
                    else resolve({ id, ...updates });
                });
            });
        }
    },
    deleteLead: async (id) => {
        if (isVercel) {
            const { error } = await supabase.from('leads').delete().eq('id', id);
            if (error) throw new Error(error.message);
            return true;
        } else {
            return new Promise((resolve, reject) => {
                db.run("DELETE FROM leads WHERE id = ?", [id], (err) => {
                    if (err) reject(err);
                    else resolve(true);
                });
            });
        }
    },
    deleteAllLeads: async () => {
        if (isVercel) {
            const { error } = await supabase.from('leads').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            if (error) throw new Error(error.message);
            return true;
        } else {
            return new Promise((resolve, reject) => {
                db.run("DELETE FROM leads", [], (err) => {
                    if (err) reject(err);
                    else resolve(true);
                });
            });
        }
    },

    // --- Follow-ups ---
    getFollowUps: async () => {
        if (isVercel) {
            const { data, error } = await supabase.from('follow_ups').select('*').order('date', { ascending: true });
            if (error) throw new Error(error.message);
            return data.map(f => ({
                id: f.id,
                type: f.type,
                contact: f.contact,
                date: f.date,
                status: f.status,
                notes: f.notes
            }));
        } else {
            return new Promise((resolve, reject) => {
                db.all(`SELECT * FROM follow_ups ORDER BY date ASC`, [], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
        }
    },
    createFollowUp: async (item) => {
        if (isVercel) {
            const payload = {
                id: item.id,
                type: item.type,
                contact: item.contact,
                date: item.date,
                status: item.status,
                notes: item.notes
            };
            const { error } = await supabase.from('follow_ups').insert([payload]);
            if (error) throw new Error(error.message);
            return item;
        } else {
            return new Promise((resolve, reject) => {
                const sql = `INSERT INTO follow_ups (id, type, contact, date, status, notes) VALUES (?, ?, ?, ?, ?, ?)`;
                db.run(sql, [item.id, item.type, item.contact, item.date, item.status, item.notes], function (err) {
                    if (err) reject(err);
                    else resolve(item);
                });
            });
        }
    },
    updateFollowUp: async (id, updates) => {
        if (isVercel) {
            const { error } = await supabase.from('follow_ups').update(updates).eq('id', id);
            if (error) throw new Error(error.message);
            return { id, ...updates };
        } else {
            return new Promise((resolve, reject) => {
                const keys = Object.keys(updates);
                if (keys.length === 0) return resolve({});
                const fields = keys.map(k => `${k} = ?`).join(', ');
                const values = keys.map(k => updates[k]);
                values.push(id);
                db.run(`UPDATE follow_ups SET ${fields} WHERE id = ?`, values, function (err) {
                    if (err) reject(err);
                    else resolve({ id, ...updates });
                });
            });
        }
    },
    deleteFollowUp: async (id) => {
        if (isVercel) {
            const { error } = await supabase.from('follow_ups').delete().eq('id', id);
            if (error) throw new Error(error.message);
            return true;
        } else {
            return new Promise((resolve, reject) => {
                db.run("DELETE FROM follow_ups WHERE id = ?", [id], (err) => {
                    if (err) reject(err);
                    else resolve(true);
                });
            });
        }
    },
    deleteAllFollowUps: async () => {
        if (isVercel) {
            const { error } = await supabase.from('follow_ups').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            if (error) throw new Error(error.message);
            return true;
        } else {
            return new Promise((resolve, reject) => {
                db.run("DELETE FROM follow_ups", [], (err) => {
                    if (err) reject(err);
                    else resolve(true);
                });
            });
        }
    }
};

// --- Purchasing Operations ---
dbAdapter.purchasing = {
    getVendors: async () => {
        if (isVercel) {
            const client = supabaseAdmin || supabase;
            if (!client) {
                console.error("[getVendors] Supabase client not initialized. Admin:", !!supabaseAdmin, "Anon:", !!supabase);
                throw new Error("Supabase client not initialized. Check server logs/env vars.");
            }
            const { data, error } = await client
                .from('vendors')
                .select('*')
                .neq('status', 'Deleted')
                .order('created_at', { ascending: false });

            if (error) {
                console.error("[getVendors] Supabase error:", error);
                throw new Error(`DB Error: ${error.message}`);
            }
            return data;
        } else {
            return new Promise((resolve, reject) => {
                db.all(`SELECT id, company_name as companyName, contact_person as contactPerson, email, phone, address, rating, status FROM vendors WHERE status != 'Deleted' ORDER BY created_at DESC`, [], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
        }
    },
    createVendor: async (vendor) => {
        if (isVercel) {
            const client = supabaseAdmin || supabase;
            if (!client) throw new Error("Supabase client not initialized");
            const payload = {
                id: vendor.id,
                company_name: vendor.companyName,
                contact_person: vendor.contactPerson,
                email: vendor.email,
                phone: vendor.phone,
                address: vendor.address,
                rating: vendor.rating,
                status: vendor.status
            };
            const { error } = await client.from('vendors').insert([payload]);
            if (error) throw new Error(error.message);
            return vendor;
        } else {
            return new Promise((resolve, reject) => {
                const sql = `INSERT INTO vendors (id, company_name, contact_person, email, phone, address, rating, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
                db.run(sql, [vendor.id, vendor.companyName, vendor.contactPerson, vendor.email, vendor.phone, vendor.address, vendor.rating, vendor.status], function (err) {
                    if (err) reject(err);
                    else resolve(vendor);
                });
            });
        }
    },
    updateVendor: async (id, updates) => {
        const mapField = (key, val) => {
            if (key === 'companyName') return ['company_name', val];
            if (key === 'contactPerson') return ['contact_person', val];
            if (key === 'email') return ['email', val];
            if (key === 'phone') return ['phone', val];
            if (key === 'address') return ['address', val];
            if (key === 'rating') return ['rating', val];
            if (key === 'status') return ['status', val];
            return null;
        };

        const mapped = {};
        for (const [key, val] of Object.entries(updates)) {
            const result = mapField(key, val);
            if (result) mapped[result[0]] = result[1];
        }

        if (Object.keys(mapped).length === 0) return { id, ...updates };

        if (isVercel) {
            const client = supabaseAdmin || supabase;
            const { error } = await client.from('vendors').update(mapped).eq('id', id);
            if (error) throw new Error(error.message);
            return { id, ...updates };
        } else {
            return new Promise((resolve, reject) => {
                const keys = Object.keys(mapped);
                const values = Object.values(mapped);
                const fields = keys.map(k => `${k} = ?`);
                values.push(id);
                db.run(`UPDATE vendors SET ${fields.join(', ')} WHERE id = ?`, values, function (err) {
                    if (err) reject(err);
                    else resolve({ id, ...updates });
                });
            });
        }
    },
    deleteVendor: async (id) => {
        if (isVercel) {
            const client = supabaseAdmin || supabase;
            // Soft Delete: Mark as 'Deleted' to preserve FKs and history
            const { error } = await client.from('vendors').update({ status: 'Deleted' }).eq('id', id);
            if (error) throw new Error(error.message);
            return true;
        } else {
            return new Promise((resolve, reject) => {
                db.run("UPDATE vendors SET status = 'Deleted' WHERE id = ?", [id], (err) => {
                    if (err) reject(err);
                    else resolve(true);
                });
            });
        }
    },

    // --- Purchase Orders ---
    getPurchaseOrders: async () => {
        if (isVercel) {
            // Join with vendors to get company_name for rows where 'vendor' column might be null
            const { data, error } = await supabase
                .from('purchase_orders')
                .select('*, vendors ( company_name )');

            if (error) throw new Error(error.message);

            // Normalize data: If 'vendor' column is missing/null, use the joined Name
            return data.map(po => ({
                ...po,
                vendor: po.vendor || po.vendors?.company_name || 'Unknown'
            }));
        } else {
            return new Promise((resolve, reject) => {
                db.all(`SELECT id, po_number as poNumber, vendor, date, expected_date as expectedDate, amount, status FROM purchase_orders ORDER BY created_at DESC`, [], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
        }
    },
    createPurchaseOrder: async (po) => {
        if (isVercel) {
            const client = supabaseAdmin || supabase;
            const payload = {
                id: po.id,
                po_number: po.poNumber,
                vendor: po.vendor, // Restore passing the name directly for robustness
                vendor_id: po.vendorId,
                date: po.date,
                expected_date: po.expectedDate,
                amount: po.amount,
                status: po.status
            };
            const { error } = await client.from('purchase_orders').insert([payload]);
            if (error) {
                // Fallback: Check for common schema issues like missing columns
                if (error.code === '42703' || error.message?.toLowerCase().includes('column')) { // Undefined column or schema error
                    console.warn('Purchase Order insert failed due to undefined column, retrying with minimal payload');
                    // Retry with a minimal safe payload if needed, or just log for now
                    // For POs, columns seem standard: po_number, vendor, date, amount, status
                    // expected_date might be the culprit if schema is old
                    if (error.message?.includes('expected_date')) {
                        delete payload.expected_date;
                        const { error: retryError } = await client.from('purchase_orders').insert([payload]);
                        if (retryError) throw new Error(retryError.message);
                    } else if (error.message?.includes('vendor')) {
                        // Vendor column missing, try vendor_id or vendor_name
                        console.warn('vendor column missing, attempting fallback to vendor_id or vendor_name');
                        delete payload.vendor;

                        // Try with vendor_id if available
                        if (po.vendorId) {
                            const payloadWithId = { ...payload, vendor_id: po.vendorId };
                            const { error: retryIdError } = await client.from('purchase_orders').insert([payloadWithId]);
                            if (!retryIdError) return po; // Success with ID
                            // If ID failed, fall through to try name?
                        }

                        // Try with vendor_name as last resort (or if no ID)
                        const payloadWithName = { ...payload, vendor_name: po.vendor };
                        const { error: retryNameError } = await client.from('purchase_orders').insert([payloadWithName]);
                        if (retryNameError) {
                            // If both failed, throw original or last error
                            throw new Error(`Failed with vendor fallbacks: ${retryNameError.message}`);
                        }
                    } else {
                        throw new Error(error.message);
                    }
                } else {
                    throw new Error(error.message);
                }
            }
            return po;
        } else {
            return new Promise((resolve, reject) => {
                const sql = `INSERT INTO purchase_orders (id, po_number, vendor, date, expected_date, amount, status) VALUES (?, ?, ?, ?, ?, ?, ?)`;
                db.run(sql, [po.id, po.poNumber, po.vendor, po.date, po.expectedDate, po.amount, po.status], function (err) {
                    if (err) reject(err);
                    else resolve(po);
                });
            });
        }
    },
    updatePurchaseOrder: async (id, updates) => {
        if (isVercel) {
            const client = supabaseAdmin || supabase;
            const mapped = {};
            for (const [key, val] of Object.entries(updates)) {
                if (key === 'expectedDate') mapped.expected_date = val;
                else if (key === 'vendor') {
                    // Skip 'vendor' if it's the name and we assume vendor_id handles the relationship
                    // Or map it if we really need to store the name.
                    // Given the error, 'vendor' column likely doesn't exist.
                    // If vendorId is present, we rely on that.
                    // If we want to support legacy text column, maybe 'vendor_name'?
                    // For now, let's IGNORE 'vendor' key if it causes issues, assuming vendorId handles the link.
                    // But if user changed vendor, we probably got vendorId too.
                }
                else if (key === 'vendorId') mapped.vendor_id = val;
                else mapped[key] = val;
            }

            // If mapped is empty after filtering, return
            if (Object.keys(mapped).length === 0) return { id, ...updates };

            const { error } = await client.from('purchase_orders').update(mapped).eq('id', id);

            if (error) {
                // Fallback similar to create: if column missing (e.g. status vs state), handle it?
                // For now, just improved mapping should fix the 'vendor' column error.
                throw new Error(error.message);
            }
            return { id, ...updates };
        } else {
            return new Promise((resolve, reject) => {
                const keys = Object.keys(updates);
                if (keys.length === 0) return resolve({});
                const fields = keys.map((key) => {
                    if (key === 'expectedDate') return 'expected_date = ?';
                    return `${key} = ?`;
                });
                const values = keys.map(k => updates[k]);
                values.push(id);
                db.run(`UPDATE purchase_orders SET ${fields.join(', ')} WHERE id = ?`, values, function (err) {
                    if (err) reject(err);
                    else resolve({ id, ...updates });
                });
            });
        }
    },
    deletePurchaseOrder: async (id) => {
        if (isVercel) {
            const client = supabaseAdmin || supabase;
            const { error } = await client.from('purchase_orders').delete().eq('id', id);
            if (error) throw new Error(error.message);
            return true;
        } else {
            return new Promise((resolve, reject) => {
                db.run("DELETE FROM purchase_orders WHERE id = ?", [id], (err) => {
                    if (err) reject(err);
                    else resolve(true);
                });
            });
        }
    },

    // --- Bills ---
    getBills: async () => {
        if (isVercel) {
            const { data, error } = await supabase
                .from('bills')
                .select('*, vendors ( company_name )')
                .order('date', { ascending: false });

            if (error) throw new Error(error.message);

            return data.map(b => ({
                id: b.id,
                billNumber: b.bill_number,
                vendor: b.vendors?.company_name || 'Unknown',
                vendorId: b.vendor_id,
                date: b.date,
                dueDate: b.due_date,
                amount: b.amount,
                status: b.status
            }));
        } else {
            return new Promise((resolve, reject) => {
                db.all(`SELECT b.id, b.bill_number as billNumber, v.company_name as vendor, b.vendor_id as vendorId, b.date, b.due_date as dueDate, b.amount, b.status 
                        FROM bills b 
                        LEFT JOIN vendors v ON b.vendor_id = v.id 
                        ORDER BY b.date DESC`, [], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
        }
    },
    createBill: async (bill) => {
        if (isVercel) {
            const client = supabaseAdmin || supabase;
            const payload = {
                id: bill.id,
                bill_number: bill.billNumber,
                vendor_id: bill.vendorId, // Use vendor_id
                date: bill.date,
                due_date: bill.dueDate,
                amount: bill.amount,
                status: bill.status
            };
            const { error } = await client.from('bills').insert([payload]);
            if (error) throw new Error(error.message);
            return bill;
        } else {
            return new Promise((resolve, reject) => {
                const sql = `INSERT INTO bills (id, bill_number, vendor_id, date, due_date, amount, status) VALUES (?, ?, ?, ?, ?, ?, ?)`;
                db.run(sql, [bill.id, bill.billNumber, bill.vendorId, bill.date, bill.dueDate, bill.amount, bill.status], function (err) {
                    if (err) reject(err);
                    else resolve(bill);
                });
            });
        }
    },
    updateBill: async (id, updates) => {
        if (isVercel) {
            const client = supabaseAdmin || supabase;
            const mapped = {};
            for (const [key, val] of Object.entries(updates)) {
                if (key === 'dueDate') mapped.due_date = val;
                else if (key === 'billNumber') mapped.bill_number = val;
                else if (key === 'vendor') { /* Ignore vendor name updates to prevent schema error */ }
                else if (key === 'vendorId') mapped.vendor_id = val;
                else mapped[key] = val;
            }
            if (Object.keys(mapped).length === 0) return { id, ...updates };
            const { error } = await client.from('bills').update(mapped).eq('id', id);
            if (error) throw new Error(error.message);
            return { id, ...updates };
        } else {
            return new Promise((resolve, reject) => {
                const keys = Object.keys(updates);
                if (keys.length === 0) return resolve({});
                const fields = keys.map((key) => {
                    if (key === 'dueDate') return 'due_date = ?';
                    return `${key} = ?`;
                });
                const values = keys.map(k => updates[k]);
                values.push(id);
                db.run(`UPDATE bills SET ${fields.join(', ')} WHERE id = ?`, values, function (err) {
                    if (err) reject(err);
                    else resolve({ id, ...updates });
                });
            });
        }
    },
    deleteBill: async (id) => {
        if (isVercel) {
            const client = supabaseAdmin || supabase;
            const { error } = await client.from('bills').delete().eq('id', id);
            if (error) throw new Error(error.message);
            return true;
        } else {
            return new Promise((resolve, reject) => {
                db.run("DELETE FROM bills WHERE id = ?", [id], (err) => {
                    if (err) reject(err);
                    else resolve(true);
                });
            });
        }
    },

    deleteAllBills: async () => {
        if (isVercel) {
            const client = supabaseAdmin || supabase;
            const { error } = await client.from('bills').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            if (error) throw new Error(error.message);
            return true;
        } else {
            return new Promise((resolve, reject) => {
                db.run("DELETE FROM bills", [], (err) => {
                    if (err) reject(err);
                    else resolve(true);
                });
            });
        }
    }
};

dbAdapter.purchasing.deleteAllVendors = async () => {
    if (isVercel) {
        const client = supabaseAdmin || supabase;
        const { error } = await client.from('vendors').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) throw new Error(error.message);
        return true;
    } else {
        return new Promise((resolve, reject) => {
            db.run("DELETE FROM vendors", [], (err) => {
                if (err) reject(err);
                else resolve(true);
            });
        });
    }
};

dbAdapter.purchasing.deleteAllPurchaseOrders = async () => {
    if (isVercel) {
        const client = supabaseAdmin || supabase;
        const { error } = await client.from('purchase_orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) throw new Error(error.message);
        return true;
    } else {
        return new Promise((resolve, reject) => {
            db.run("DELETE FROM purchase_orders", [], (err) => {
                if (err) reject(err);
                else resolve(true);
            });
        });
    }
};

// --- Sales Operations ---
dbAdapter.sales = {
    getOrders: async () => {
        if (isVercel) {
            const { data, error } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
            if (error) throw new Error(error.message);
            return data.map(r => ({
                id: r.id,
                orderNumber: r.invoice_number,
                customer: r.customer_name,
                amount: r.amount,
                status: r.delivery_status || r.status || 'Processing',
                paymentStatus: r.status,
                date: r.date,
                dueDate: r.due_date
            }));
        } else {
            return new Promise((resolve, reject) => {
                db.all('SELECT * FROM invoices ORDER BY created_at DESC', [], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows.map(r => ({
                        id: r.id,
                        orderNumber: r.invoice_number,
                        customer: r.customer_name,
                        amount: r.amount,
                        status: r.delivery_status || r.status || 'Processing',
                        paymentStatus: r.status,
                        date: r.date,
                        dueDate: r.due_date
                    })));
                });
            });
        }
    },
    createOrder: async (order) => {
        if (isVercel) {
            const payload = {
                id: order.id,
                invoice_number: order.orderNumber,
                customer_name: order.customer,
                amount: order.amount,
                status: order.paymentStatus || 'Pending',
                delivery_status: order.status || 'Processing',
                date: order.date,
                due_date: order.dueDate
            };

            const { error } = await supabase.from('invoices').insert([payload]);
            if (error) {
                // Fallback: If delivery_status doesn't exist (code 42703 implies undefined column in Postgres)
                if (error.code === '42703' || error.message?.includes('delivery_status')) {
                    console.warn('delivery_status column missing, retrying without it');
                    delete payload.delivery_status;
                    const { error: retryError } = await supabase.from('invoices').insert([payload]);
                    if (retryError) throw new Error(retryError.message);
                } else {
                    throw new Error(error.message);
                }
            }
            return order;
        } else {
            return new Promise((resolve, reject) => {
                const sql = `INSERT INTO invoices (id, invoice_number, customer_name, amount, status, delivery_status, date, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
                db.run(sql, [
                    order.id,
                    order.orderNumber,
                    order.customer,
                    order.amount,
                    order.paymentStatus || 'Pending',
                    order.status || 'Processing',
                    order.date,
                    order.dueDate
                ], function (err) {
                    if (err) reject(err);
                    else resolve(order);
                });
            });
        }
    },
    deleteAllOrders: async () => {
        if (isVercel) {
            const { error } = await supabase.from('invoices').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            if (error) throw new Error(error.message);
            return true;
        } else {
            return new Promise((resolve, reject) => {
                db.run('DELETE FROM invoices', [], (err) => {
                    if (err) reject(err);
                    else resolve(true);
                });
            });
        }
    }
};

// --- System Operations ---
dbAdapter.system = {
    getLogs: async () => {
        if (isVercel) {
            const { data, error } = await supabase.from('activity_logs').select('*').order('timestamp', { ascending: false }).limit(50);
            if (error) return []; // Return empty if error or table missing
            return data;
        } else {
            return new Promise((resolve, reject) => {
                db.all(`SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 50`, [], (err, rows) => {
                    // Resolve empty if generic error (e.g. table not found in early dev)
                    if (err) resolve([]);
                    else resolve(rows);
                });
            });
        }
    },
    getCompanyProfile: async () => {
        if (isVercel) {
            // Try fetching, if fail return mock
            try {
                const { data, error } = await supabase.from('company_profile').select('*').limit(1).single();
                if (error || !data) throw error;
                return data;
            } catch (e) {
                return {
                    name: 'Financa Global',
                    legalName: 'Financa Technologies Pvt Ltd',
                    email: 'admin@financa.com'
                };
            }
        } else {
            return new Promise((resolve, reject) => {
                db.get(`SELECT * FROM company_profile LIMIT 1`, [], (err, row) => {
                    if (err || !row) {
                        resolve({
                            name: 'Financa Global',
                            legalName: 'Financa Technologies Pvt Ltd',
                            email: 'admin@financa.com'
                        });
                    } else {
                        resolve(row);
                    }
                });
            });
        }
    }
};



















// --- Finance Operations (Returns Extension) ---
Object.assign(dbAdapter.finance, {
    // Returns (Credit/Debit Notes)
    getReturns: async () => {
        if (isVercel) {
            const { data, error } = await supabase.from('finance_returns').select('*').order('created_at', { ascending: false });
            if (error) throw new Error(error.message);
            return data.map(r => ({
                id: r.id,
                returnNumber: r.return_number,
                referenceInvoice: r.reference_invoice,
                entityName: r.entity_name,
                type: r.type,
                amount: r.amount,
                reason: r.reason,
                status: r.status,
                date: r.date
            }));
        } else {
            return new Promise((resolve, reject) => {
                db.all("SELECT * FROM finance_returns ORDER BY created_at DESC", [], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows.map(r => ({
                        id: r.id,
                        returnNumber: r.return_number,
                        referenceInvoice: r.reference_invoice,
                        entityName: r.entity_name,
                        type: r.type,
                        amount: r.amount,
                        reason: r.reason,
                        status: r.status,
                        date: r.date
                    })));
                });
            });
        }
    },

    createReturn: async (ret) => {
        if (isVercel) {
            const payload = {
                id: ret.id,
                return_number: ret.returnNumber,
                reference_invoice: ret.referenceInvoice,
                entity_name: ret.entityName,
                type: ret.type,
                amount: ret.amount,
                reason: ret.reason,
                status: ret.status,
                date: ret.date
            };
            const { error } = await supabase.from('finance_returns').insert([payload]);
            if (error) throw new Error(error.message);
            return ret;
        } else {
            return new Promise((resolve, reject) => {
                const sql = "INSERT INTO finance_returns (id, return_number, reference_invoice, entity_name, type, amount, reason, status, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
                db.run(sql, [ret.id, ret.returnNumber, ret.referenceInvoice, ret.entityName, ret.type, ret.amount, ret.reason, ret.status, ret.date], function (err) {
                    if (err) reject(err);
                    else resolve(ret);
                });
            });
        }
    },

    updateReturn: async (id, updates) => {
        if (isVercel) {
            const mapped = {};
            // Map frontend keys to DB column names if disparate, for these they match mostly
            for (const [key, val] of Object.entries(updates)) {
                if (key === 'returnNumber') mapped.return_number = val;
                else if (key === 'referenceInvoice') mapped.reference_invoice = val;
                else if (key === 'entityName') mapped.entity_name = val;
                else mapped[key] = val;
            }
            if (Object.keys(mapped).length === 0) return { id, ...updates };

            const { error } = await supabase.from('finance_returns').update(mapped).eq('id', id);
            if (error) throw new Error(error.message);
            return { id, ...updates };
        } else {
            return new Promise((resolve, reject) => {
                const keys = Object.keys(updates);
                if (keys.length === 0) return resolve({});

                const fields = keys.map((key) => {
                    if (key === 'returnNumber') return 'return_number = ?';
                    if (key === 'referenceInvoice') return 'reference_invoice = ?';
                    if (key === 'entityName') return 'entity_name = ?';
                    return `${key} = ?`;
                });
                const values = keys.map(k => updates[k]);
                values.push(id);

                const sql = `UPDATE finance_returns SET ${fields.join(', ')} WHERE id = ?`;
                db.run(sql, values, function (err) {
                    if (err) reject(err);
                    else resolve({ id, ...updates });
                });
            });
        }
    },

    deleteReturn: async (id) => {
        if (isVercel) {
            const { error } = await supabase.from('finance_returns').delete().eq('id', id);
            if (error) throw new Error(error.message);
            return true;
        } else {
            return new Promise((resolve, reject) => {
                db.run("DELETE FROM finance_returns WHERE id = ?", [id], (err) => {
                    if (err) reject(err);
                    else resolve(true);
                });
            });
        }
    },

    updateReturnStatus: async (id, status) => {
        if (isVercel) {
            const { error } = await supabase.from('finance_returns').update({ status }).eq('id', id);
            if (error) throw new Error(error.message);
            return { id, status };
        } else {
            return new Promise((resolve, reject) => {
                db.run("UPDATE finance_returns SET status = ? WHERE id = ?", [status, id], function (err) {
                    if (err) reject(err);
                    else resolve({ id, status });
                });
            });
        }
    },

    deleteAllReturns: async () => {
        if (isVercel) {
            const client = supabaseAdmin || supabase;
            const { error } = await client.from('finance_returns').delete().gte('created_at', '1900-01-01');
            if (error) throw new Error(error.message);
            return { success: true };
        } else {
            return new Promise((resolve, reject) => {
                db.run("DELETE FROM finance_returns", [], function (err) {
                    if (err) reject(err);
                    else resolve({ success: true });
                });
            });
        }
    }
});

export default dbAdapter;
