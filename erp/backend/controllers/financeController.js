import dbAdapter from '../dbAdapter.js';
import { v4 as uuidv4 } from 'uuid';
import xlsx from 'xlsx';

// --- Helper: Fuzzy column matching ---
const getValue = (row, ...keys) => {
    const rowKeys = Object.keys(row);
    for (const key of keys) {
        const foundKey = rowKeys.find(k => k.toLowerCase().trim() === key.toLowerCase());
        if (foundKey) return row[foundKey];
    }
    return null;
};

// --- Accounts ---
export const getAccounts = async (req, res) => {
    try {
        let accounts = await dbAdapter.finance.getAccounts();

        // Use hardcoded defaults to avoid file dependency issues
        const defaultAccounts = [
            // Assets
            { id: 'cash', name: 'Cash on Hand', type: 'Asset', category: 'Current Asset', normalBalance: 'Debit', description: 'Physical cash' },
            { id: 'bank', name: 'Bank Account', type: 'Asset', category: 'Current Asset', normalBalance: 'Debit', description: 'Business bank account' },
            { id: 'accounts-receivable', name: 'Accounts Receivable', type: 'Asset', category: 'Current Asset', normalBalance: 'Debit', description: 'Money owed by customers' },
            { id: 'inventory', name: 'Inventory', type: 'Asset', category: 'Current Asset', normalBalance: 'Debit', description: 'Stock of goods' },
            { id: 'furniture', name: 'Furniture & Fixtures', type: 'Asset', category: 'Fixed Asset', normalBalance: 'Debit', description: 'Office furniture' },
            { id: 'office-equipment', name: 'Office Equipment', type: 'Asset', category: 'Fixed Asset', normalBalance: 'Debit', description: 'Computers and equipment' },
            { id: 'vehicles', name: 'Vehicles', type: 'Asset', category: 'Fixed Asset', normalBalance: 'Debit', description: 'Company vehicles' },
            { id: 'building', name: 'Building & Land', type: 'Asset', category: 'Fixed Asset', normalBalance: 'Debit', description: 'Real estate' },

            // Liabilities
            { id: 'accounts-payable', name: 'Accounts Payable', type: 'Liability', category: 'Current Liability', normalBalance: 'Credit', description: 'Money owed to suppliers' },
            { id: 'salaries-payable', name: 'Salaries Payable', type: 'Liability', category: 'Current Liability', normalBalance: 'Credit', description: 'Unpaid wages' },
            { id: 'tax-payable', name: 'Tax Payable', type: 'Liability', category: 'Current Liability', normalBalance: 'Credit', description: 'Taxes owed' },
            { id: 'utilities-payable', name: 'Utilities Payable', type: 'Liability', category: 'Current Liability', normalBalance: 'Credit', description: 'Unpaid bills' },
            { id: 'bank-loan', name: 'Bank Loan (Long Term)', type: 'Liability', category: 'Non-Current Liability', normalBalance: 'Credit', description: 'Long term debt' },

            // Equity
            { id: 'owners-capital', name: 'Owners Capital', type: 'Equity', category: 'Equity', normalBalance: 'Credit', description: 'Owner investment' },
            { id: 'drawings', name: 'Drawings', type: 'Equity', category: 'Equity', normalBalance: 'Debit', description: 'Owner withdrawals' },
            { id: 'retained-earnings', name: 'Retained Earnings', type: 'Equity', category: 'Equity', normalBalance: 'Credit', description: 'Retained profits' },

            // Revenue
            { id: 'sales-revenue', name: 'Sales Revenue', type: 'Revenue', category: 'Operating Revenue', normalBalance: 'Credit', description: 'Income from sales' },
            { id: 'service-revenue', name: 'Service Revenue', type: 'Revenue', category: 'Operating Revenue', normalBalance: 'Credit', description: 'Income from services' },
            { id: 'interest-income', name: 'Interest Income', type: 'Revenue', category: 'Non-Operating Revenue', normalBalance: 'Credit', description: 'Interest earnings' },

            // Expenses
            { id: 'cost-of-goods-sold', name: 'Cost of Goods Sold', type: 'Expense', category: 'Direct Expense', normalBalance: 'Debit', description: 'Cost of goods sold' },
            { id: 'rent-expense', name: 'Rent Expense', type: 'Expense', category: 'Operating Expense', normalBalance: 'Debit', description: 'Office rent' },
            { id: 'salary-expense', name: 'Salary Expense', type: 'Expense', category: 'Operating Expense', normalBalance: 'Debit', description: 'Employee salaries' },
            { id: 'utilities-expense', name: 'Utilities Expense', type: 'Expense', category: 'Operating Expense', normalBalance: 'Debit', description: 'Utility bills' },
            { id: 'marketing-expense', name: 'Marketing Expense', type: 'Expense', category: 'Operating Expense', normalBalance: 'Debit', description: 'Ads and promo' },
            { id: 'purchases', name: 'Purchases', type: 'Expense', category: 'Direct Expense', normalBalance: 'Debit', description: 'Goods for resale' },
            { id: 'office-supplies', name: 'Office Supplies', type: 'Expense', category: 'Operating Expense', normalBalance: 'Debit', description: 'Supplies' }
        ];

        // Re-seed if we are missing accounts (simple check on count)
        if (!accounts || accounts.length < 5) { // Force seed if very low, e.g. previous partial seed or empty
            console.log('Seeding default accounts...');
            await dbAdapter.finance.seedAccounts(defaultAccounts);
            // Reload accounts
            accounts = await dbAdapter.finance.getAccounts();
        } else if (accounts.length < defaultAccounts.length) {
            // Upsert missing ones without deleting existing
            // Note: seedAccounts in dbAdapter(Vercel) uses Upsert, so safe to run.
            console.log('Syncing missing default accounts...');
            await dbAdapter.finance.seedAccounts(defaultAccounts);
            accounts = await dbAdapter.finance.getAccounts();
        }

        res.json(accounts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const uploadFinanceData = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        const transactions = data.map(row => {
            const dateStr = getValue(row, 'date', 'created_at', 'timestamp');
            // Try to parse date, fallback to now if invalid
            let date = new Date(dateStr);
            if (isNaN(date.getTime())) date = new Date();

            return {
                id: uuidv4(),
                date: date.toISOString(), // Standardize to ISO string for DB
                description: getValue(row, 'description', 'desc', 'details', 'memo') || 'Imported Transaction',
                amount: parseFloat(getValue(row, 'amount', 'amt', 'value', 'price')) || 0,
                type: getValue(row, 'type', 'category', 'kind') || 'Expense', // Default to Expense if unknown
                category: getValue(row, 'category', 'cat', 'group') || 'Uncategorized',
                reference: getValue(row, 'reference', 'ref', 'id') || `IMP-${Date.now()}`
            };
        });

        await dbAdapter.finance.createTransactions(transactions);
        res.json({ message: `Successfully imported ${transactions.length} transactions` });
    } catch (error) {
        console.error('Import error:', error);
        res.status(500).json({ error: 'Failed to process file: ' + error.message });
    }
};

// --- Transactions ---
export const getTransactions = async (req, res) => {
    try {
        const rows = await dbAdapter.finance.getTransactions();
        const transactions = rows.map(r => ({
            id: r.id,
            date: r.date,
            description: r.description,
            amount: r.amount,
            type: r.type,
            category: r.category,
            reference: r.reference
        }));
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const createTransaction = async (req, res) => {
    try {
        const { date, description, amount, debitAccount, creditAccount } = req.body;

        // Create Double Entry Records
        // 1. Debit Side
        const debitRecord = {
            id: uuidv4(),
            date: date,
            description: description,
            amount: parseFloat(amount),
            type: debitAccount?.type || 'Expense', // e.g. 'Expense', 'Asset'
            category: debitAccount?.name || 'Uncategorized',
            reference: `JE-${Date.now()}` // Same reference links them
        };

        // 2. Credit Side (for T-Accounts, we usually just store positive numbers and let type define side)
        // However, if we want them to balance zero in a single list, one might be negative.
        // But for this simple ERP, usually we just list "Transactions" that happened.
        // If I store BOTH, the "Total Value" might double?
        // Let's look at Journal Page "Total Entries". Use of "Double Entry" usually implies 2 rows.
        // But if the user just wants to see "I spent $50", showing 2 rows might be confusing unless grouped.
        // The Journal Entry Form implies a proper accounting entry.
        // Let's store BOTH.

        const creditRecord = {
            id: uuidv4(),
            date: date,
            description: description, // or "Credit: " + description
            amount: parseFloat(amount), // Keep positive, type determines direction in reporting
            type: creditAccount?.type || 'Income', // e.g. 'Revenue', 'Liability'
            category: creditAccount?.name || 'Uncategorized',
            reference: debitRecord.reference
        };

        await dbAdapter.finance.createTransactions([debitRecord, creditRecord]);
        res.status(201).json({ success: true, reference: debitRecord.reference });

    } catch (err) {
        console.error('Create Transaction Error:', err);
        res.status(500).json({ error: err.message });
    }
};

export const deleteAllTransactions = async (req, res) => {
    try {
        await dbAdapter.finance.deleteAllTransactions();
        res.json({ message: 'All transactions deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- Invoices ---
export const getInvoices = async (req, res) => {
    try {
        const rows = await dbAdapter.finance.getInvoices();
        const invoices = rows.map(r => ({
            id: r.id,
            invoiceNumber: r.invoice_number || r.invoiceNumber,
            customer: r.customer_name || r.customer,
            date: r.date,
            dueDate: r.due_date || r.dueDate,
            amount: r.amount,
            status: r.status,
            items: r.items_count || r.items || 0
        }));
        res.json(invoices);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const createInvoice = async (req, res) => {
    const { customer, date, dueDate, items } = req.body;

    const id = uuidv4();
    const invoiceNumber = `INV-${Math.floor(10000 + Math.random() * 90000)}`;
    const itemsCount = items ? items.length : 0;
    const totalAmount = items ? items.reduce((sum, item) => sum + (item.price * item.quantity), 0) : 0;

    const newInvoice = {
        id,
        invoiceNumber,
        customer,
        date,
        dueDate,
        amount: totalAmount,
        status: 'Pending',
        itemsCount
    };

    try {
        const saved = await dbAdapter.finance.createInvoice(newInvoice, items);
        res.status(201).json(saved);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateInvoiceStatus = async (req, res) => {
    try {
        const result = await dbAdapter.finance.updateInvoiceStatus(req.params.id, req.body.status);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteInvoice = async (req, res) => {
    try {
        await dbAdapter.finance.deleteInvoice(req.params.id);
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteAllInvoices = async (req, res) => {
    try {
        await dbAdapter.finance.deleteAllInvoices();
        res.json({ message: 'All invoices deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- Payments ---
export const getPayments = async (req, res) => {
    try {
        const rows = await dbAdapter.finance.getPayments();
        const payments = rows.map(r => ({
            id: r.id,
            paymentNumber: r.payment_number || r.paymentNumber,
            vendor: r.vendor,
            amount: r.amount,
            date: r.date,
            method: r.method,
            status: r.status
        }));
        res.json(payments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const createPayment = async (req, res) => {
    const { vendor, amount, method, status } = req.body;
    const id = uuidv4();
    const paymentNumber = `PAY-${Math.floor(10000 + Math.random() * 90000)}`;
    const date = new Date().toISOString();

    const newPayment = {
        id, paymentNumber, vendor, amount, date, method, status: status || 'Completed'
    };

    try {
        const saved = await dbAdapter.finance.createPayment(newPayment);
        res.status(201).json(saved);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updatePaymentStatus = async (req, res) => {
    try {
        const result = await dbAdapter.finance.updatePaymentStatus(req.params.id, req.body.status);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updatePayment = async (req, res) => {
    try {
        const result = await dbAdapter.finance.updatePayment(req.params.id, req.body);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteAllPayments = async (req, res) => {
    try {
        await dbAdapter.finance.deleteAllPayments();
        res.json({ message: 'All payments deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const deletePayment = async (req, res) => {
    try {
        await dbAdapter.finance.deletePayment(req.params.id);
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
