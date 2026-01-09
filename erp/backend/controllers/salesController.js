import dbAdapter from '../dbAdapter.js';
import { v4 as uuidv4 } from 'uuid';

export const getOrders = async (req, res) => {
    try {
        const orders = await dbAdapter.sales.getOrders();
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const createOrder = async (req, res) => {
    const { customer, amount, status, paymentStatus } = req.body;
    const id = uuidv4();
    const invoice_number = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;
    const date = new Date().toISOString();
    const due_date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days due

    const newOrder = {
        id,
        orderNumber: invoice_number,
        customer,
        amount,
        status: status || 'Processing', // Reverted to Processing as default for delivery_status map
        paymentStatus: paymentStatus || 'Pending',
        date,
        dueDate: due_date
    };

    try {
        const savedOrder = await dbAdapter.sales.createOrder(newOrder);
        res.status(201).json(savedOrder);
    } catch (err) {
        console.error('Create Order Error:', err);
        res.status(500).json({
            error: err.message,
            details: JSON.stringify(err),
            code: err.code || 'UNKNOWN',
            hint: err.hint || 'Check Vercel logs'
        });
    }
};

export const deleteAllOrders = async (req, res) => {
    try {
        await dbAdapter.sales.deleteAllOrders();
        res.json({ message: 'All orders deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
