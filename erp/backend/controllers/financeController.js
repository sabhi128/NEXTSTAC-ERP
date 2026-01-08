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
