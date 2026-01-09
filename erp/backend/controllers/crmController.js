import dbAdapter from '../dbAdapter.js';
import { v4 as uuidv4 } from 'uuid';

export const getCustomers = async (req, res) => {
    try {
        const rows = await dbAdapter.crm.getCustomers();
        const customers = rows.map(r => ({
            id: r.id,
            name: r.name,
            company: r.company,
            email: r.email,
            phone: r.phone,
            address: r.address,
            status: r.status,
            notes: r.notes,
            totalOrders: r.total_orders || r.totalOrders || 0,
            lastOrderDate: r.last_order_date || r.lastOrderDate,
            createdAt: r.created_at
        }));
        res.json(customers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const createCustomer = async (req, res) => {
    const { name, company, email, phone, address, status, notes } = req.body;
    const id = uuidv4();
    const newCustomer = { id, name, company, email, phone, address, status: status || 'Active', notes };

    try {
        const result = await dbAdapter.crm.createCustomer(newCustomer);
        res.status(201).json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateCustomer = async (req, res) => {
    const data = req.body.updates || req.body;
    if (!data || Object.keys(data).length === 0) return res.json({});

    try {
        const result = await dbAdapter.crm.updateCustomer(req.params.id, data);
        res.json({
            id: result.id,
            name: result.name,
            company: result.company,
            email: result.email,
            phone: result.phone,
            address: result.address,
            status: result.status,
            notes: result.notes,
            totalOrders: result.total_orders || result.totalOrders,
            lastOrderDate: result.last_order_date || result.lastOrderDate
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteCustomer = async (req, res) => {
    try {
        await dbAdapter.crm.deleteCustomer(req.params.id);
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- Leads ---
export const getLeads = async (req, res) => {
    try {
        const rows = await dbAdapter.crm.getLeads();
        // Standardize output if needed.
        // Assuming rows are already in reasonable format (sqlite returns snake_case if table defined so? 
        // Table: id, name, company, email, phone, source, status, estimated_value
        const leads = rows.map(r => ({
            id: r.id,
            name: r.name,
            company: r.company,
            email: r.email,
            phone: r.phone,
            source: r.source,
            status: r.status,
            estimatedValue: r.estimated_value || r.estimatedValue || 0,
            createdAt: r.created_at
        }));
        res.json(leads);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const createLead = async (req, res) => {
    const { name, company, email, phone, source, status, estimatedValue } = req.body;
    const id = uuidv4();
    const val = estimatedValue || req.body.value || 0;

    const newLead = {
        id, name, company, email, phone, source, status: status || 'New', estimatedValue: val
    };

    try {
        const result = await dbAdapter.crm.createLead(newLead);
        res.status(201).json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateLead = async (req, res) => {
    const data = req.body.updates || req.body;
    if (!data || Object.keys(data).length === 0) return res.json({});

    try {
        const result = await dbAdapter.crm.updateLead(req.params.id, data);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


export const deleteLead = async (req, res) => {
    try {
        await dbAdapter.crm.deleteLead(req.params.id);
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteAllCustomers = async (req, res) => {
    try {
        await dbAdapter.crm.deleteAllCustomers();
        res.json({ message: 'All customers deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteAllLeads = async (req, res) => {
    try {
        await dbAdapter.crm.deleteAllLeads();
        res.json({ message: 'All leads deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- Follow-ups ---
export const getFollowUps = async (req, res) => {
    try {
        const rows = await dbAdapter.crm.getFollowUps();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const createFollowUp = async (req, res) => {
    const { type, contact, date, status, notes } = req.body;
    const id = uuidv4();
    const newFollowUp = { id, type, contact, date, status: status || 'Pending', notes };

    try {
        const result = await dbAdapter.crm.createFollowUp(newFollowUp);
        res.status(201).json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateFollowUp = async (req, res) => {
    const updates = req.body;
    try {
        const result = await dbAdapter.crm.updateFollowUp(req.params.id, updates);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteFollowUp = async (req, res) => {
    try {
        await dbAdapter.crm.deleteFollowUp(req.params.id);
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteAllFollowUps = async (req, res) => {
    try {
        await dbAdapter.crm.deleteAllFollowUps();
        res.json({ message: 'All follow-ups deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
