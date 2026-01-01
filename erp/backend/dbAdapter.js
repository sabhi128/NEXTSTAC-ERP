import db from './db.js';
import supabase from './supabaseClient.js';

const isVercel = process.env.VERCEL === '1';

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
            return data;
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
            return data;
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

        // Add updated_at timestamp
        dbUpdates.updated_at = new Date().toISOString();

        // --- HISTORY TRACKING ---
        // Before updating, check if critical fields changed.
        try {
            // Need the old record. Since this is inside dbAdapter.hr, we can call getEmployeeById via 'this' if bound, or direct DB call.
            // But 'this' might be tricky. Let's do a direct DB fetch for safety (SQLite specific here as Vercel block is separate).

            if (!isVercel) {
                const oldEmp = await new Promise((resolve) => {
                    db.get(`SELECT * FROM employees WHERE id = ?`, [id], (err, row) => resolve(row));
                });

                if (oldEmp) {
                    const changes = [];
                    // Check Position
                    if (updates.position && updates.position !== oldEmp.position) changes.push('position');
                    // Check Level (Promotion)
                    if (updates.promotionLevel && updates.promotionLevel !== oldEmp.promotion_level) changes.push('level');
                    // Check Salary
                    if (updates.salary && String(updates.salary) !== String(oldEmp.salary)) changes.push('salary');
                    // Check Department
                    if (updates.department && updates.department !== oldEmp.department_name) changes.push('department');

                    if (changes.length > 0) {
                        // Insert History
                        const { v4: uuidv4 } = await import('uuid');
                        const historyId = uuidv4();
                        const changeDate = new Date().toISOString();
                        const changedBy = updates.updatedBy || 'System'; // Pass updatedBy from controller if available

                        await new Promise((resolve, reject) => {
                            db.run(`INSERT INTO employee_history 
                                (id, employee_id, old_position, old_level, old_salary, old_department, new_position, new_level, new_salary, new_department, change_date, changed_by)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                [
                                    historyId,
                                    id,
                                    oldEmp.position,
                                    oldEmp.promotion_level,
                                    oldEmp.salary,
                                    oldEmp.department_name,
                                    updates.position || oldEmp.position,
                                    updates.promotionLevel || oldEmp.promotion_level,
                                    updates.salary || oldEmp.salary,
                                    updates.department || oldEmp.department_name,
                                    changeDate,
                                    changedBy
                                ],
                                (err) => {
                                    if (err) console.error("History Insert Error:", err); // Log but don't fail update?
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

        if (isVercel) {
            // ... (Keep Vercel logic mostly same or assume user is Local)
            if (!supabase) throw new Error('Supabase client not initialized');
            const { data, error } = await supabase.from('employees').update(dbUpdates).eq('id', id).select();
            if (error) throw new Error(error.message);
            return data[0];
        } else {
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
            // Supabase implementation needed if migrating
            return [];
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

    // Leaves
    getAllLeaves: async () => {
        if (isVercel) {
            const { data, error } = await supabase.from('leaves').select('*').order('created_at', { ascending: false });
            if (error) throw new Error(error.message);
            // Transform snake_case to camelCase for consistency if needed? 
            // Controller expects: leave.employee_id etc.
            return data;
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

    // Attendance
    getAllAttendance: async () => {
        if (isVercel) {
            const { data, error } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
            if (error) throw new Error(error.message);
            return data;
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
            for (const [key, val] of Object.entries(updates)) {
                if (key === 'checkIn') mapped.check_in = val;
                else if (key === 'checkOut') mapped.check_out = val;
                else if (key === 'workHours') mapped.work_hours = val;
                else mapped[key] = val;
            }
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
    }
};

// --- Inventory Operations ---
dbAdapter.inventory = {
    getProducts: async () => {
        if (isVercel) {
            const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
            if (error) throw new Error(error.message);
            return data;
        } else {
            return new Promise((resolve, reject) => {
                db.all(`SELECT id, name, sku, category, price, stock, min_stock as minStock, supplier, status, last_updated as lastUpdated FROM products ORDER BY created_at DESC`, [], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
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
                supplier: product.supplier,
                status: product.status,
                last_updated: product.lastUpdated
            };
            const { error } = await supabase.from('products').insert([payload]);
            if (error) throw new Error(error.message);
            return product;
        } else {
            return new Promise((resolve, reject) => {
                const stmt = db.prepare("INSERT INTO products (id, name, sku, category, price, stock, min_stock, supplier, status, last_updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                stmt.run(product.id, product.name, product.sku, product.category, product.price, product.stock, product.minStock, product.supplier, product.status, product.lastUpdated, function (err) {
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
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) throw new Error(error.message);
            return true;
        } else {
            return new Promise((resolve, reject) => {
                db.run("DELETE FROM products WHERE id = ?", [id], (err) => {
                    if (err) reject(err);
                    else resolve(true);
                });
            });
        }
    }
};

// --- Finance Operations ---
dbAdapter.finance = {
    // Transactions
    getTransactions: async () => {
        if (isVercel) {
            const { data, error } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
            if (error) throw new Error(error.message);
            return data;
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

    getInvoices: async () => {
        if (isVercel) {
            const { data, error } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
            if (error) throw new Error(error.message);
            return data;
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

    getPayments: async () => {
        if (isVercel) {
            const { data, error } = await supabase.from('payments').select('*').order('created_at', { ascending: false });
            if (error) throw new Error(error.message);
            return data;
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
    }
};

// --- CRM Operations ---
dbAdapter.crm = {
    getCustomers: async () => {
        if (isVercel) {
            const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
            if (error) throw new Error(error.message);
            return data;
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
    }
};

// --- Purchasing Operations ---
dbAdapter.purchasing = {
    getVendors: async () => {
        if (isVercel) {
            const { data, error } = await supabase.from('vendors').select('*').order('created_at', { ascending: false });
            if (error) throw new Error(error.message);
            return data;
        } else {
            return new Promise((resolve, reject) => {
                db.all(`SELECT id, company_name as companyName, contact_person as contactPerson, email, phone, address, rating, status FROM vendors ORDER BY created_at DESC`, [], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
        }
    },
    createVendor: async (vendor) => {
        if (isVercel) {
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
            const { error } = await supabase.from('vendors').insert([payload]);
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
        if (isVercel) {
            const mapped = {};
            for (const [key, val] of Object.entries(updates)) {
                if (key === 'companyName') mapped.company_name = val;
                else if (key === 'contactPerson') mapped.contact_person = val;
                else mapped[key] = val;
            }
            const { error } = await supabase.from('vendors').update(mapped).eq('id', id);
            if (error) throw new Error(error.message);
            return { id, ...updates };
        } else {
            return new Promise((resolve, reject) => {
                const keys = Object.keys(updates);
                if (keys.length === 0) return resolve({});
                const fields = keys.map((key) => {
                    if (key === 'companyName') return 'company_name = ?';
                    if (key === 'contactPerson') return 'contact_person = ?';
                    return `${key} = ?`;
                });
                const values = keys.map(k => updates[k]);
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
            const { error } = await supabase.from('vendors').delete().eq('id', id);
            if (error) throw new Error(error.message);
            return true;
        } else {
            return new Promise((resolve, reject) => {
                db.run("DELETE FROM vendors WHERE id = ?", [id], (err) => {
                    if (err) reject(err);
                    else resolve(true);
                });
            });
        }
    },

    // --- Purchase Orders ---
    getPurchaseOrders: async () => {
        if (isVercel) {
            const { data, error } = await supabase.from('purchase_orders').select('*').order('created_at', { ascending: false });
            if (error) throw new Error(error.message);
            return data;
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
            const payload = {
                id: po.id,
                po_number: po.poNumber,
                vendor: po.vendor,
                date: po.date,
                expected_date: po.expectedDate,
                amount: po.amount,
                status: po.status
            };
            const { error } = await supabase.from('purchase_orders').insert([payload]);
            if (error) throw new Error(error.message);
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
            const mapped = {};
            for (const [key, val] of Object.entries(updates)) {
                if (key === 'expectedDate') mapped.expected_date = val;
                else mapped[key] = val;
            }
            const { error } = await supabase.from('purchase_orders').update(mapped).eq('id', id);
            if (error) throw new Error(error.message);
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
            const { error } = await supabase.from('purchase_orders').delete().eq('id', id);
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
            const { data, error } = await supabase.from('bills').select('*').order('created_at', { ascending: false });
            if (error) throw new Error(error.message);
            return data;
        } else {
            return new Promise((resolve, reject) => {
                db.all(`SELECT id, bill_number as billNumber, vendor, date, due_date as dueDate, amount, status FROM bills ORDER BY created_at DESC`, [], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
        }
    },
    createBill: async (bill) => {
        if (isVercel) {
            const payload = {
                id: bill.id,
                bill_number: bill.billNumber,
                vendor: bill.vendor,
                date: bill.date,
                due_date: bill.dueDate,
                amount: bill.amount,
                status: bill.status
            };
            const { error } = await supabase.from('bills').insert([payload]);
            if (error) throw new Error(error.message);
            return bill;
        } else {
            return new Promise((resolve, reject) => {
                const sql = `INSERT INTO bills (id, bill_number, vendor, date, due_date, amount, status) VALUES (?, ?, ?, ?, ?, ?, ?)`;
                db.run(sql, [bill.id, bill.billNumber, bill.vendor, bill.date, bill.dueDate, bill.amount, bill.status], function (err) {
                    if (err) reject(err);
                    else resolve(bill);
                });
            });
        }
    },
    updateBill: async (id, updates) => {
        if (isVercel) {
            const mapped = {};
            for (const [key, val] of Object.entries(updates)) {
                if (key === 'dueDate') mapped.due_date = val;
                else mapped[key] = val;
            }
            const { error } = await supabase.from('bills').update(mapped).eq('id', id);
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
            const { error } = await supabase.from('bills').delete().eq('id', id);
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


























export default dbAdapter;
