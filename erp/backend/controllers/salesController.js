import db from '../db.js';
import { v4 as uuidv4 } from 'uuid';

export const getOrders = (req, res) => {
    const sql = 'SELECT * FROM invoices ORDER BY created_at DESC';
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        const orders = rows.map(r => ({
            id: r.id,
            orderNumber: r.invoice_number || r.orderNumber,
            customer: r.customer_name || r.customer,
            amount: r.amount,
            status: r.status,
            paymentStatus: r.payment_status || 'Pending', // Attempt to read payment status if exists
            date: r.date,
            dueDate: r.due_date
        }));
        res.json(orders);
    });
};

export const createOrder = (req, res) => {
    const { customer, amount, status, paymentStatus } = req.body;
    const id = uuidv4();
    const invoice_number = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;
    const date = new Date().toISOString();
    const due_date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const sql = `INSERT INTO invoices (id, invoice_number, customer_name, amount, status, date, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)`;

    db.run(sql, [id, invoice_number, customer, amount, status || 'Processing', date, due_date], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({
            id,
            orderNumber: invoice_number,
            customer,
            amount,
            status: status || 'Processing',
            date,
            dueDate: due_date
        });
    });
};

export const deleteAllOrders = async (req, res) => {
    // Orders are Invoices in this system
    const sql = 'DELETE FROM invoices';
    db.run(sql, [], (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'All orders deleted successfully' });
    });
};
