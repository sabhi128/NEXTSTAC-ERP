import { faker } from '@faker-js/faker';
import { chartOfAccounts } from '../data/chartOfAccounts';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const STORAGE_KEYS = {
    EMPLOYEES: 'erp_mock_employees_v3_force_fix', // Bumped key to force re-seed
    PRODUCTS: 'erp_mock_products',
    CUSTOMERS: 'erp_mock_customers',
    VENDORS: 'erp_mock_vendors',
};

// Helper to get or seed data
const getOrSeed = (key, seedFn, count = 10) => {
    const stored = localStorage.getItem(key);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.warn(`Failed to parse ${key}, reseeding.`);
        }
    }
    const data = Array.from({ length: count }, seedFn);
    localStorage.setItem(key, JSON.stringify(data));
    return data;
};

export const mockDataService = {
    // Users (RBAC)
    getUsers: () => {
        const key = 'erp_mock_users_v2';
        const stored = localStorage.getItem(key);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0 && Array.isArray(parsed[0])) {
                console.warn('Detected corrupted mock user data, re-seeding...');
                localStorage.removeItem(key);
            } else {
                return parsed;
            }
        }

        const users = [
            {
                id: '1',
                name: 'Super Admin',
                email: 'admin@test.com',
                password: 'password',
                role: 'super_admin',
                status: 'Active',
                avatar: 'https://ui-avatars.com/api/?name=Super+Admin&background=6366f1&color=fff'
            },
            {
                id: '2',
                name: 'E-commerce Manager',
                email: 'ecom@test.com',
                password: 'password',
                role: 'ecommerce_admin',
                status: 'Active',
                avatar: 'https://ui-avatars.com/api/?name=Ecom+Admin&background=10b981&color=fff'
            },
            {
                id: '3',
                name: 'Dev Admin',
                email: 'dev@test.com',
                password: 'password',
                role: 'dev_admin',
                status: 'Active',
                avatar: 'https://ui-avatars.com/api/?name=Dev+Admin&background=f59e0b&color=fff'
            }
        ];

        localStorage.setItem(key, JSON.stringify(users));
        return users;
    },

    // Admin Alias & Helpers
    getAdmins: () => mockDataService.getUsers(),

    addAdmin: (admin) => {
        const users = mockDataService.getUsers();
        const newAdmin = {
            id: faker.string.uuid(),
            password: 'password', // Default
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(admin.name)}&background=random`,
            status: 'Active',
            sharePercentage: 0,
            ...admin
        };
        users.push(newAdmin);
        localStorage.setItem('erp_mock_users_v2', JSON.stringify(users));
        return { success: true, data: newAdmin };
    },

    updateAdmin: (id, updates) => {
        const users = mockDataService.getUsers();
        const index = users.findIndex(u => u.id === id);
        if (index !== -1) {
            users[index] = { ...users[index], ...updates };
            localStorage.setItem('erp_mock_users_v2', JSON.stringify(users));
            return { success: true, data: users[index] };
        }
        return { success: false, error: 'User not found' };
    },

    deleteAdmin: (id) => {
        const users = mockDataService.getUsers();
        const newUsers = users.filter(u => u.id !== id);
        localStorage.setItem('erp_mock_users_v2', JSON.stringify(newUsers));
        return { success: true };
    },

    // Compensation Config
    getCompensationConfig: () => {
        const key = 'erp_mock_comp_config';
        const stored = localStorage.getItem(key);
        if (stored) return JSON.parse(stored);

        const config = { basePool: 50000 };
        localStorage.setItem(key, JSON.stringify(config));
        return config;
    },

    updateCompensationConfig: (updates) => {
        const config = mockDataService.getCompensationConfig();
        const newConfig = { ...config, ...updates };
        localStorage.setItem('erp_mock_comp_config', JSON.stringify(newConfig));
        return { success: true, data: newConfig };
    },

    // Employees - Backend API Integration
    getEmployees: async () => {
        const { api } = await import('../lib/api');
        return api.get('/hr/employees');
    },

    getEmployeeHistory: async (id) => {
        const { api } = await import('../lib/api');
        return api.get(`/hr/employees/${id}/history`);
    },

    addEmployee: async (employee) => {
        const { api } = await import('../lib/api');

        let payload = employee;

        if (!(employee instanceof FormData)) {
            payload = {
                ...employee,
                avatar: employee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.firstName + ' ' + employee.lastName)}&background=random`
            };
        } else {
            if (!employee.get('avatar')) {
                const name = (employee.get('firstName') || '') + ' ' + (employee.get('lastName') || '');
                employee.append('avatar', `https://ui-avatars.com/api/?name=${encodeURIComponent(name.trim())}&background=random`);
            }
            payload = employee;
        }

        const data = await api.post('/hr/employees', payload);
        return { success: true, data };
    },

    updateEmployee: async (id, updates) => {
        const { api } = await import('../lib/api');
        const data = await api.put(`/hr/employees/${id}`, updates);
        return { success: true, data };
    },

    deleteEmployee: async (id) => {
        const { api } = await import('../lib/api');
        await api.delete(`/hr/employees/${id}`);
        return { success: true };
    },

    deleteAllEmployees: async () => {
        const { api } = await import('../lib/api');
        await api.delete('/hr/employees/all');
        return { success: true };
    },

    // --- INVENTORY ---
    getProducts: async () => {
        const { api } = await import('../lib/api');
        return api.get('/inventory/products');
    },

    addProduct: async (product) => {
        const { api } = await import('../lib/api');
        const data = await api.post('/inventory/products', product);
        return { success: true, data };
    },

    updateProduct: async (id, updates) => {
        const { api } = await import('../lib/api');
        const data = await api.put(`/inventory/products/${id}`, { updates });
        return { success: true, data };
    },

    deleteProduct: async (id) => {
        const { api } = await import('../lib/api');
        await api.delete(`/inventory/products/${id}`);
        return { success: true };
    },

    // --- FINANCE: INVOICES ---
    getInvoices: async () => {
        const { api } = await import('../lib/api');
        return api.get('/finance/invoices');
    },

    addInvoice: async (invoice) => {
        const { api } = await import('../lib/api');
        const data = await api.post('/finance/invoices', invoice);
        return { success: true, data };
    },

    updateInvoiceStatus: async (id, status) => {
        const { api } = await import('../lib/api');
        const data = await api.patch(`/finance/invoices/${id}/status`, { status });
        return { success: true, data };
    },

    deleteInvoice: async (id) => {
        const { api } = await import('../lib/api');
        await api.delete(`/finance/invoices/${id}`);
        return { success: true };
    },

    // --- FINANCE: PAYMENTS ---
    getPayments: async () => {
        const { api } = await import('../lib/api');
        return api.get('/finance/payments');
    },

    addPayment: async (payment) => {
        const { api } = await import('../lib/api');
        const data = await api.post('/finance/payments', payment);
        return { success: true, data };
    },

    updatePaymentStatus: async (id, status) => {
        const { api } = await import('../lib/api');
        const data = await api.patch(`/finance/payments/${id}/status`, { status });
        return { success: true, data };
    },

    deletePayment: async (id) => {
        const { api } = await import('../lib/api');
        await api.delete(`/finance/payments/${id}`);
        return { success: true };
    },

    // Vendors
    getVendors: () => {
        return getOrSeed(STORAGE_KEYS.VENDORS, () => ({
            id: faker.string.uuid(),
            companyName: faker.company.name(),
            contactPerson: faker.person.fullName(),
            email: faker.internet.email(),
            phone: faker.phone.number(),
            address: faker.location.streetAddress(),
            rating: faker.number.int({ min: 1, max: 5 }),
            status: faker.helpers.arrayElement(['Active', 'Inactive'])
        }), 8);
    },

    addVendor: (vendor) => {
        const vendors = mockDataService.getVendors();
        const newVendor = {
            id: faker.string.uuid(),
            status: 'Active',
            rating: 5,
            ...vendor
        };
        vendors.unshift(newVendor);
        localStorage.setItem(STORAGE_KEYS.VENDORS, JSON.stringify(vendors));
        return { success: true, data: newVendor };
    },

    updateVendor: (id, updates) => {
        const vendors = mockDataService.getVendors();
        const index = vendors.findIndex(v => v.id === id);
        if (index !== -1) {
            vendors[index] = { ...vendors[index], ...updates };
            localStorage.setItem(STORAGE_KEYS.VENDORS, JSON.stringify(vendors));
            return { success: true, data: vendors[index] };
        }
        return { success: false, error: 'Vendor not found' };
    },

    deleteVendor: (id) => {
        const vendors = mockDataService.getVendors();
        const newVendors = vendors.filter(v => v.id !== id);
        localStorage.setItem(STORAGE_KEYS.VENDORS, JSON.stringify(newVendors));
        return { success: true };
    },

    // Purchase Orders
    getPurchaseOrders: () => {
        return getOrSeed('erp_mock_purchase_orders', () => ({
            id: faker.string.uuid(),
            poNumber: `PO-${faker.string.numeric(5)}`,
            vendor: faker.company.name(),
            date: faker.date.recent({ days: 45 }).toISOString(),
            expectedDate: faker.date.soon({ days: 15 }).toISOString(),
            amount: parseFloat(faker.finance.amount({ min: 500, max: 10000, dec: 2 })),
            status: faker.helpers.arrayElement(['Draft', 'Ordered', 'Received', 'Cancelled']),
        }), 15);
    },

    addPurchaseOrder: (order) => {
        const orders = mockDataService.getPurchaseOrders();
        const newOrder = {
            id: faker.string.uuid(),
            poNumber: `PO-${faker.string.numeric(5)}`,
            status: 'Draft',
            ...order
        };
        orders.unshift(newOrder);
        localStorage.setItem('erp_mock_purchase_orders', JSON.stringify(orders));
        return { success: true, data: newOrder };
    },

    updatePurchaseOrder: (id, updates) => {
        const orders = mockDataService.getPurchaseOrders();
        const index = orders.findIndex(o => o.id === id);
        if (index !== -1) {
            orders[index] = { ...orders[index], ...updates };
            localStorage.setItem('erp_mock_purchase_orders', JSON.stringify(orders));
            return { success: true, data: orders[index] };
        }
        return { success: false, error: 'Order not found' };
    },

    deletePurchaseOrder: (id) => {
        const orders = mockDataService.getPurchaseOrders();
        const newOrders = orders.filter(o => o.id !== id);
        localStorage.setItem('erp_mock_purchase_orders', JSON.stringify(newOrders));
        return { success: true };
    },

    // Bills
    getBills: () => {
        return getOrSeed('erp_mock_bills', () => ({
            id: faker.string.uuid(),
            billNumber: `BILL-${faker.string.numeric(5)}`,
            vendor: faker.company.name(),
            date: faker.date.recent({ days: 30 }).toISOString(),
            dueDate: faker.date.soon({ days: 30 }).toISOString(),
            amount: parseFloat(faker.finance.amount({ min: 100, max: 5000, dec: 2 })),
            status: faker.helpers.arrayElement(['Paid', 'Pending', 'Overdue']),
        }), 15);
    },

    addBill: (bill) => {
        const bills = mockDataService.getBills();
        const newBill = {
            id: faker.string.uuid(),
            billNumber: `BILL-${faker.string.numeric(5)}`,
            status: 'Pending',
            ...bill
        };
        bills.unshift(newBill);
        localStorage.setItem('erp_mock_bills', JSON.stringify(bills));
        return { success: true, data: newBill };
    },

    updateBill: (id, updates) => {
        const bills = mockDataService.getBills();
        const index = bills.findIndex(b => b.id === id);
        if (index !== -1) {
            bills[index] = { ...bills[index], ...updates };
            localStorage.setItem('erp_mock_bills', JSON.stringify(bills));
            return { success: true, data: bills[index] };
        }
        return { success: false, error: 'Bill not found' };
    },

    deleteBill: (id) => {
        const bills = mockDataService.getBills();
        const newBills = bills.filter(b => b.id !== id);
        localStorage.setItem('erp_mock_bills', JSON.stringify(newBills));
        return { success: true };
    },

    // --- CRM: CUSTOMERS ---
    getCustomers: async () => {
        const response = await fetch(`${API_URL}/crm/customers`);
        if (!response.ok) throw new Error('Failed to fetch customers');
        return response.json();
    },

    addCustomer: async (customer) => {
        const response = await fetch(`${API_URL}/crm/customers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(customer),
        });
        if (!response.ok) throw new Error('Failed to add customer');
        return { success: true, data: await response.json() };
    },

    updateCustomer: async (id, updates) => {
        const response = await fetch(`${API_URL}/crm/customers/${id}`, {
            method: 'PUT', // Route uses PUT
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ updates }),
        });
        if (!response.ok) throw new Error('Failed to update customer');
        return { success: true, data: await response.json() };
    },

    deleteCustomer: async (id) => {
        const response = await fetch(`${API_URL}/crm/customers/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete customer');
        return { success: true };
    },

    // Orders (Sales)
    getOrders: async () => {
        const { api } = await import('../lib/api');
        const orders = await api.get('/sales/orders');
        // Map backend invoice fields to frontend order fields
        return orders.map(o => ({
            id: o.id,
            orderNumber: o.invoice_number || o.invoiceNumber, // Handle both snake_case and camelCase
            customer: o.customer_name || o.customer,
            date: o.date,
            amount: o.amount,
            status: o.status,
            paymentStatus: o.status === 'Paid' ? 'Paid' : 'Pending', // Infer payment status from order status for now
            formattedDate: new Date(o.date).toLocaleDateString()
        }));
    },

    addOrder: async (order) => {
        const { api } = await import('../lib/api');
        // Map frontend order fields to backend invoice fields
        const payload = {
            customer_name: order.customer, // Map customer -> customer_name
            amount: order.amount,
            status: order.paymentStatus || 'Pending', // Use paymentStatus because backend 'invoices' table has CHECK constraint (Paid, Pending, Overdue)
            date: order.date || new Date().toISOString(),
            due_date: order.dueDate || new Date().toISOString()
        };
        const response = await api.post('/sales/orders', payload);
        return { success: true, data: response };
    },

    addLead: (lead) => {
        const leads = mockDataService.getLeads();
        const newLead = {
            id: faker.string.uuid(),
            status: 'New',
            ...lead
        };
        leads.unshift(newLead);
        localStorage.setItem('erp_mock_leads', JSON.stringify(leads));
        return { success: true, data: newLead };
    },

    updateLead: (id, updates) => {
        const leads = mockDataService.getLeads();
        const index = leads.findIndex(l => l.id === id);
        if (index !== -1) {
            leads[index] = { ...leads[index], ...updates };
            localStorage.setItem('erp_mock_leads', JSON.stringify(leads));
            return { success: true, data: leads[index] };
        }
        return { success: false, error: 'Lead not found' };
    },

    deleteLead: (id) => {
        const leads = mockDataService.getLeads();
        const newLeads = leads.filter(l => l.id !== id);
        localStorage.setItem('erp_mock_leads', JSON.stringify(newLeads));
        return { success: true };
    },

    convertLead: (id) => {
        const leads = mockDataService.getLeads();
        const lead = leads.find(l => l.id === id);
        if (lead) {
            mockDataService.addCustomer({
                name: lead.name,
                company: lead.company,
                email: lead.email,
                phone: lead.phone,
                status: 'Active',
                notes: `Converted from lead. Source: ${lead.source}`
            });
            return mockDataService.deleteLead(id);
        }
        return { success: false, error: 'Lead not found' };
    },

    // Follow-ups
    getFollowUps: () => {
        return getOrSeed('erp_mock_followups', () => ({
            id: faker.string.uuid(),
            contact: faker.person.fullName(),
            type: faker.helpers.arrayElement(['Call', 'Email', 'Meeting']),
            date: faker.date.future({ days: 14 }).toISOString(),
            status: faker.helpers.arrayElement(['Scheduled', 'Pending', 'Done']),
            notes: faker.lorem.sentence()
        }), 10);
    },

    // Files (Documents)
    getFiles: async () => {
        const { api } = await import('../lib/api');
        return api.get('/documents');
    },

    addFile: async (fileData) => {
        const { file, uploadedBy } = fileData;
        const formData = new FormData();

        if (file) {
            formData.append('file', file);
            formData.append('uploadedBy', uploadedBy || 'User');
        }

        // We need to bypass the default JSON headers in api.js, so we use raw fetch here
        // or we could assume api.js handles FormData if we pass a specific flag, but raw fetch is safer for today.
        // Helper to get token
        const getSessionToken = () => {
            const sessionData = sessionStorage.getItem('app_session') || localStorage.getItem('app_session');
            return sessionData ? JSON.parse(sessionData).access_token : '';
        };
        const token = getSessionToken();

        const response = await fetch(`${API_URL}/documents/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
                // Content-Type is left empty so browser sets boundary
            },
            body: formData
        });

        if (!response.ok) throw new Error('Failed to upload file');
        const data = await response.json();
        return { success: true, data };
    },

    deleteFile: async (id) => {
        const { api } = await import('../lib/api');
        await api.delete(`/documents/${id}`);
        return { success: true };
    },

    downloadFile: async (file) => {
        const getSessionToken = () => {
            const sessionData = sessionStorage.getItem('app_session') || localStorage.getItem('app_session');
            return sessionData ? JSON.parse(sessionData).access_token : '';
        };
        const token = getSessionToken();

        const response = await fetch(`${API_URL}/documents/download/${file.id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Download failed');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name; // Use original name
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    },

    approveFile: async (id) => {
        const { api } = await import('../lib/api');
        await api.put(`/documents/${id}/approve`);
        return { success: true };
    },

    rejectFile: async (id) => {
        const { api } = await import('../lib/api');
        await api.put(`/documents/${id}/reject`);
        return { success: true };
    },

    // Activity Logs
    getLogs: async () => {
        const { api } = await import('../lib/api');
        return api.get('/system/logs');
    },

    // Attendance
    getAttendance: () => {
        return getOrSeed('erp_mock_attendance', () => ({
            id: faker.string.uuid(),
            employeeName: faker.person.fullName(),
            date: faker.date.recent({ days: 14 }).toLocaleDateString(),
            checkIn: '09:00 AM',
            checkOut: '05:00 PM',
            status: faker.helpers.arrayElement(['Present', 'Absent', 'Late', 'Half Day']),
            workHours: '8h 0m'
        }), 20);
    },

    updateAttendance: (id, updates) => {
        const attendance = mockDataService.getAttendance();
        const index = attendance.findIndex(p => p.id === id);
        if (index !== -1) {
            attendance[index] = { ...attendance[index], ...updates };
            // Persist to localStorage
            const records = JSON.parse(localStorage.getItem('erp_mock_attendance'));
            if (records) {
                const storageIndex = records.findIndex(r => r.id === id);
                if (storageIndex !== -1) {
                    records[storageIndex] = { ...records[storageIndex], ...updates };
                    localStorage.setItem('erp_mock_attendance', JSON.stringify(records));
                }
            }
            return attendance[index];
        }
        return null;
    },

    addAttendance: (newRecord) => {
        const attendance = mockDataService.getAttendance();
        const record = {
            id: newRecord.id || Math.floor(Math.random() * 10000),
            workHours: '8h 0m',
            ...newRecord
        };
        attendance.unshift(record);
        localStorage.setItem('erp_mock_attendance', JSON.stringify(attendance));
        return record;
    },

    // Salaries (Payroll)
    getSalaries: () => {
        return getOrSeed('erp_mock_salaries', () => ({
            id: faker.string.uuid(),
            employeeName: faker.person.fullName(),
            paymentDate: faker.date.recent({ days: 30 }).toISOString(),
            amount: parseFloat(faker.finance.amount({ min: 3000, max: 10000, dec: 2 })),
            method: faker.helpers.arrayElement(['Bank Transfer', 'Check']),
            status: faker.helpers.arrayElement(['Paid', 'Pending'])
        }), 15);
    },

    updateSalary: (id, updates) => {
        const salaries = mockDataService.getSalaries();
        const index = salaries.findIndex(s => s.id === id);
        if (index !== -1) {
            salaries[index] = { ...salaries[index], ...updates };
            localStorage.setItem('erp_mock_salaries', JSON.stringify(salaries));
            return { success: true, data: salaries[index] };
        }
        return { success: false, error: 'Salary record not found' };
    },

    deleteAllSalaries: () => {
        localStorage.removeItem('erp_mock_salaries');
        return { success: true };
    },

    // Company Profile
    getCompanyProfile: () => {
        return getOrSeed('erp_mock_company_profile_v2', () => ({
            id: faker.string.uuid(),
            name: 'Financa Tech Global',
            legalName: 'Financa Technologies Pvt Ltd',
            logo: faker.image.url({ width: 200, height: 200 }),
            website: 'nextstac.com/',
            email: 'contact@financa-tech.com',
            phone: '+1 (555) 123-4567',
            foundedYear: '2015',
            description: 'Leading provider of enterprise ERP solutions and global e-commerce development. Bridging the gap between modern tech and business efficiency.',
            taxId: 'US-EIN-98-7654321',
            registrationNumber: 'REG-2015-8899',
            vatNumber: 'EU998877665',

            // International Commerce
            currencies: ['USD', 'EUR', 'GBP', 'INR'],
            primaryLanguage: 'English',
            timeZone: 'GMT-5 (EST)',
            operatingRegions: ['North America', 'Europe', 'Asia Pacific'],

            // Dev & Tech
            type: 'Technology & Retail',
            techStack: ['React', 'Node.js', 'Python', 'AWS', 'Shopify Plus'],

            // Address
            headquarters: {
                street: '123 Innovation Drive, Tech Park',
                city: 'San Francisco',
                state: 'CA',
                country: 'USA',
                zip: '94043'
            },

            socials: {
                linkedin: 'www.linkedin.com/company/nextstac/',
                github: 'github.com/financa-dev',
                twitter: '@financa_tech'
            }
        }), 1)[0];
    },

    updateCompanyProfile: (updates) => {
        const currentProfile = mockDataService.getCompanyProfile(); // Gets from storage if exists
        const updatedProfile = { ...currentProfile, ...updates };

        // Wrap in array because getOrSeed expects an array structure for this key if we used it as a list
        // but here getCompanyProfile accesses [0].
        // To remain consistent with getCompanyProfile's storage read:
        localStorage.setItem('erp_mock_company_profile_v2', JSON.stringify([updatedProfile]));

        return updatedProfile;
    },

    // Leave Management - Backend API Integration
    getAllLeaves: async () => {
        const { api } = await import('../lib/api');
        return api.get('/hr/leaves');
    },

    getLeaveRequests: async () => {
        const { api } = await import('../lib/api');
        const all = await api.get('/hr/leaves');
        return all.filter(l => l.status === 'Pending');
    },

    getEmployeeLeaves: async (employeeId) => {
        const { api } = await import('../lib/api');
        const all = await api.get('/hr/leaves');
        return all.filter(l => l.employeeId === employeeId).sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
    },

    createLeave: async (leaveData) => {
        const { api } = await import('../lib/api');
        const data = await api.post('/hr/leaves', leaveData);
        return { success: true, data };
    },

    updateLeaveStatus: async (id, status) => {
        const { api } = await import('../lib/api');
        const data = await api.put(`/hr/leaves/${id}/status`, { status });
        return data;
    },

    processPayroll: (period) => {
        const salaries = mockDataService.getSalaries();
        const newRecords = Array.from({ length: 5 }).map(() => ({
            id: faker.string.uuid(),
            employeeName: faker.person.fullName(),
            paymentDate: new Date().toISOString(),
            amount: parseFloat(faker.finance.amount({ min: 3000, max: 10000, dec: 2 })),
            method: 'Bank Transfer',
            status: 'Pending'
        }));

        salaries.unshift(...newRecords);
        localStorage.setItem('erp_mock_salaries', JSON.stringify(salaries));
        return newRecords;
    },

    getSalaryHistory: (employeeId) => {
        const key = `erp_mock_salary_history_${employeeId || 'default'}`;
        return getOrSeed(key, () => ({
            id: faker.string.uuid(),
            employeeId: employeeId,
            amount: parseFloat(faker.finance.amount({ min: 40000, max: 90000, dec: 0 })),
            effectiveDate: faker.date.past({ years: 3 }).toISOString(),
            reason: faker.helpers.arrayElement(['Initial Offer', 'Annual Review', 'Promotion', 'Market Adjustment']),
        }), 5).sort((a, b) => new Date(b.effectiveDate) - new Date(a.effectiveDate));
    },

    // Accounts (Finance)
    getAccounts: () => {
        return getOrSeed('erp_mock_accounts', null, 0) || (() => {
            localStorage.setItem('erp_mock_accounts', JSON.stringify(chartOfAccounts));
            return chartOfAccounts;
        })();
    },

    // Transactions (Finance)
    getTransactions: () => {
        return getOrSeed('erp_mock_transactions', () => {
            const accounts = chartOfAccounts;
            const debitAccount = faker.helpers.arrayElement(accounts.filter(a => a.normalBalance === 'Debit'));
            const creditAccount = faker.helpers.arrayElement(accounts.filter(a => a.normalBalance === 'Credit'));

            return {
                id: faker.string.uuid(),
                date: faker.date.recent({ days: 90 }).toISOString(),
                description: faker.finance.transactionDescription(),
                amount: parseFloat(faker.finance.amount({ min: 100, max: 10000, dec: 2 })),
                debit_account_id: debitAccount.id,
                credit_account_id: creditAccount.id,
                debitAccount: debitAccount,
                creditAccount: creditAccount
            };
        }, 50);
    },

    addTransaction: (transaction) => {
        const transactions = mockDataService.getTransactions();
        const newTransaction = {
            id: faker.string.uuid(),
            ...transaction,
            date: transaction.date || new Date().toISOString()
        };
        transactions.unshift(newTransaction);
        localStorage.setItem('erp_mock_transactions', JSON.stringify(transactions));
        return { success: true, data: newTransaction };
    },

    resetData: () => {
        Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
        const customKeys = [
            'erp_mock_accounts', 'erp_mock_files', 'erp_mock_logs', 'erp_mock_transactions',
            'erp_mock_admins', 'erp_mock_branches', 'erp_mock_departments', 'erp_mock_attendance',
            'erp_mock_salaries', 'erp_mock_leave', 'erp_mock_warehouses', 'erp_mock_stock_movements'
        ];
        customKeys.forEach(key => localStorage.removeItem(key));
        window.location.reload();
    },

    // --- Phase 2: New Modules ---

    // --- Branches ---
    getBranches: () => {
        return getOrSeed('erp_mock_branches', () => ({
            id: faker.string.uuid(),
            name: faker.location.city() + ' Branch',
            manager: faker.person.fullName(),
            address: faker.location.streetAddress(),
            phone: faker.phone.number(),
            status: 'Active'
        }), 5);
    },

    addBranch: (branch) => {
        const branches = mockDataService.getBranches();
        const newBranch = {
            id: faker.string.uuid(),
            ...branch,
            status: 'Active'
        };
        branches.push(newBranch);
        localStorage.setItem('erp_mock_branches', JSON.stringify(branches));
        return { success: true, data: newBranch };
    },

    updateBranch: (id, updates) => {
        const branches = mockDataService.getBranches();
        const index = branches.findIndex(b => b.id === id);
        if (index !== -1) {
            branches[index] = { ...branches[index], ...updates };
            localStorage.setItem('erp_mock_branches', JSON.stringify(branches));
            return { success: true, data: branches[index] };
        }
        return { success: false, error: 'Branch not found' };
    },

    deleteBranch: (id) => {
        const branches = mockDataService.getBranches();
        const newBranches = branches.filter(b => b.id !== id);
        localStorage.setItem('erp_mock_branches', JSON.stringify(newBranches));
        return { success: true };
    },

    // --- Departments ---
    getDepartments: () => {
        return getOrSeed('erp_mock_departments', () => ({
            id: faker.string.uuid(),
            name: faker.commerce.department(),
            head: faker.person.fullName(),
            employeeCount: faker.number.int({ min: 5, max: 50 }),
            budget: parseFloat(faker.finance.amount({ min: 50000, max: 500000, dec: 2 }))
        }), 8);
    },

    addDepartment: (dept) => {
        const departments = mockDataService.getDepartments();
        const newDept = {
            id: faker.string.uuid(),
            ...dept,
            employeeCount: 0
        };
        departments.push(newDept);
        localStorage.setItem('erp_mock_departments', JSON.stringify(departments));
        return { success: true, data: newDept };
    },

    updateDepartment: (id, updates) => {
        const departments = mockDataService.getDepartments();
        const index = departments.findIndex(d => d.id === id);
        if (index !== -1) {
            departments[index] = { ...departments[index], ...updates };
            localStorage.setItem('erp_mock_departments', JSON.stringify(departments));
            return { success: true, data: departments[index] };
        }
        return { success: false, error: 'Department not found' };
    },

    deleteDepartment: (id) => {
        const departments = mockDataService.getDepartments();
        const newDepartments = departments.filter(d => d.id !== id);
        localStorage.setItem('erp_mock_departments', JSON.stringify(newDepartments));
        return { success: true };
    },

    // --- Warehouses ---
    getWarehouses: () => {
        return getOrSeed('erp_mock_warehouses', () => ({
            id: faker.string.uuid(),
            name: faker.location.city() + ' Warehouse',
            location: faker.location.streetAddress(),
            capacity: faker.number.int({ min: 1000, max: 10000 }),
            manager: faker.person.fullName(),
            status: 'Active',
            contactNumber: faker.phone.number()
        }), 4);
    },

    addWarehouse: (warehouse) => {
        const warehouses = mockDataService.getWarehouses();
        const newWarehouse = {
            id: faker.string.uuid(),
            status: 'Active',
            ...warehouse
        };
        warehouses.push(newWarehouse);
        localStorage.setItem('erp_mock_warehouses', JSON.stringify(warehouses));
        return { success: true, data: newWarehouse };
    },

    updateWarehouse: (id, updates) => {
        const warehouses = mockDataService.getWarehouses();
        const index = warehouses.findIndex(w => w.id === id);
        if (index !== -1) {
            warehouses[index] = { ...warehouses[index], ...updates };
            localStorage.setItem('erp_mock_warehouses', JSON.stringify(warehouses));
            return { success: true, data: warehouses[index] };
        }
        return { success: false, error: 'Warehouse not found' };
    },

    deleteWarehouse: (id) => {
        const warehouses = mockDataService.getWarehouses();
        const newWarehouses = warehouses.filter(w => w.id !== id);
        localStorage.setItem('erp_mock_warehouses', JSON.stringify(newWarehouses));
        return { success: true };
    },

    deleteAllWarehouses: () => {
        localStorage.setItem('erp_mock_warehouses', JSON.stringify([]));
        return { success: true };
    },

    // --- Stock Movements ---
    getStockMovements: () => {
        return getOrSeed('erp_mock_stock_movements', () => {
            const products = mockDataService.getProducts();
            const product = faker.helpers.arrayElement(products);
            return {
                id: faker.string.uuid(),
                productId: product?.id || faker.string.uuid(),
                productName: product?.name || 'Generic Item',
                sku: product?.sku || 'SKU-000',
                type: faker.helpers.arrayElement(['In', 'Out', 'Adjustment']),
                quantity: faker.number.int({ min: 1, max: 100 }),
                date: faker.date.recent().toISOString(),
                reason: faker.helpers.arrayElement(['Purchase', 'Sale', 'Damage', 'Correction']),
                reference: `REF-${faker.string.alphanumeric(6).toUpperCase()}`
            };
        }, 30);
    },

    // --- Returns ---
    getReturns: () => {
        return getOrSeed('erp_mock_returns', () => ({
            id: faker.string.uuid(),
            returnNumber: `RET-${faker.string.numeric(5)}`,
            referenceInvoice: `INV-${faker.string.numeric(5)}`,
            entityName: faker.company.name(),
            type: faker.helpers.arrayElement(['Credit Note', 'Debit Note']), // Credit = Sales Return, Debit = Purchase Return
            date: faker.date.recent({ days: 60 }).toISOString(),
            amount: parseFloat(faker.finance.amount({ min: 50, max: 2000, dec: 2 })),
            reason: faker.helpers.arrayElement(['Damaged Goods', 'Incorrect Item', 'Defective', 'Overcharged', 'Cancelled']),
            status: faker.helpers.arrayElement(['Pending', 'Approved', 'Processed', 'Rejected'])
        }), 20);
    },

    addReturn: (returnData) => {
        const returns = mockDataService.getReturns();
        const newReturn = {
            id: faker.string.uuid(),
            returnNumber: `RET-${faker.string.numeric(5)}`,
            date: new Date().toISOString(),
            status: 'Pending',
            ...returnData
        };
        returns.unshift(newReturn);
        localStorage.setItem('erp_mock_returns', JSON.stringify(returns));
        return { success: true, data: newReturn };
    },

    updateReturnStatus: (id, status) => {
        const returns = mockDataService.getReturns();
        const index = returns.findIndex(r => r.id === id);
        if (index !== -1) {
            returns[index].status = status;
            localStorage.setItem('erp_mock_returns', JSON.stringify(returns));
            return { success: true, data: returns[index] };
        }
        return { success: false, error: 'Return not found' };
    },

    deleteAllReturns: () => {
        localStorage.setItem('erp_mock_returns', JSON.stringify([]));
        return { success: true };
    },

    addStockMovement: (movement) => {
        const movements = mockDataService.getStockMovements();
        const newMovement = {
            id: faker.string.uuid(),
            date: new Date().toISOString(),
            ...movement
        };
        movements.unshift(newMovement);
        localStorage.setItem('erp_mock_stock_movements', JSON.stringify(movements));
        return { success: true, data: newMovement };
    },

    // --- Accounting / Journal ---
    getAccounts: () => {
        // Return flattened accounts list or structured based on chartOfAccounts
        // Assuming chartOfAccounts is array of { id, name, type, ... }
        return chartOfAccounts;
    },

    getTransactions: () => {
        return getOrSeed('erp_mock_transactions', () => {
            const accounts = chartOfAccounts;
            const debitAcc = faker.helpers.arrayElement(accounts.filter(a => a.type === 'Asset' || a.type === 'Expense'));
            const creditAcc = faker.helpers.arrayElement(accounts.filter(a => a.type === 'Liability' || a.type === 'Revenue' || a.type === 'Equity'));

            return {
                id: faker.string.uuid(),
                date: faker.date.recent({ days: 30 }).toISOString(),
                description: faker.finance.transactionDescription(),
                amount: parseFloat(faker.finance.amount({ min: 100, max: 5000, dec: 2 })),
                debit_account_id: debitAcc?.id,
                credit_account_id: creditAcc?.id,
                debitAccount: debitAcc,
                creditAccount: creditAcc,
                reference: `JRN-${faker.string.numeric(5)}`
            };
        }, 15);
    },

    addTransaction: (transaction) => {
        const transactions = mockDataService.getTransactions();
        const newTransaction = {
            id: faker.string.uuid(),
            reference: `JRN-${faker.string.numeric(5)}`,
            ...transaction
        };
        transactions.unshift(newTransaction);
        localStorage.setItem('erp_mock_transactions', JSON.stringify(transactions));
        return { success: true, data: newTransaction };
    },

    deleteAllTransactions: () => {
        localStorage.setItem('erp_mock_transactions', JSON.stringify([]));
        return { success: true };
    },

    // Vendors
    getVendors: () => {
        return getOrSeed('erp_mock_vendors', () => ({
            id: faker.string.uuid(),
            companyName: faker.company.name(),
            contactPerson: faker.person.fullName(),
            email: faker.internet.email(),
            phone: faker.phone.number(),
            address: faker.location.streetAddress(),
            status: faker.helpers.arrayElement(['Active', 'Inactive']),
            rating: faker.number.int({ min: 3, max: 5 })
        }), 12);
    },

    addVendor: (vendor) => {
        const vendors = mockDataService.getVendors();
        const newVendor = {
            id: faker.string.uuid(),
            status: 'Active',
            rating: 5,
            ...vendor
        };
        vendors.unshift(newVendor);
        localStorage.setItem('erp_mock_vendors', JSON.stringify(vendors));
        return { success: true, data: newVendor };
    },

    updateVendor: (id, updates) => {
        const vendors = mockDataService.getVendors();
        const index = vendors.findIndex(v => v.id === id);
        if (index !== -1) {
            vendors[index] = { ...vendors[index], ...updates };
            localStorage.setItem('erp_mock_vendors', JSON.stringify(vendors));
            return { success: true, data: vendors[index] };
        }
        return { success: false, error: 'Vendor not found' };
    },

    deleteVendor: (id) => {
        const vendors = mockDataService.getVendors();
        const newVendors = vendors.filter(v => v.id !== id);
        localStorage.setItem('erp_mock_vendors', JSON.stringify(newVendors));
        return { success: true };
    },

    deleteAllVendors: () => {
        localStorage.setItem('erp_mock_vendors', JSON.stringify([]));
        return { success: true };
    },

    // Orders Actions

};
