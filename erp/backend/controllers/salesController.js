import db from '../db.js';
import { v4 as uuidv4 } from 'uuid';

export const getOrders = (req, res) => {
    const sql = 'SELECT * FROM invoices ORDER BY created_at DESC';
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
};

export const createOrder = (req, res) => {
    const { customer_name, amount, status, date, due_date } = req.body;
    const id = uuidv4();
    const invoice_number = `INV-${Date.now()}`; // Simple generation

    const sql = `INSERT INTO invoices (id, invoice_number, customer_name, amount, status, date, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)`;

    db.run(sql, [id, invoice_number, customer_name, amount, status || 'Pending', date, due_date], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id, invoice_number, customer_name, amount, status: status || 'Pending' });
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
