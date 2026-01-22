import dbAdapter from '../dbAdapter.js';
import { v4 as uuidv4 } from 'uuid';

// --- Vendors ---
export const getVendors = async (req, res) => {
    try {
        const rows = await dbAdapter.purchasing.getVendors();
        const vendors = rows.map(r => ({
            id: r.id,
            companyName: r.company_name || r.companyName,
            contactPerson: r.contact_person || r.contactPerson,
            email: r.email,
            phone: r.phone,
            address: r.address,
            rating: r.rating,
            status: r.status,
            createdAt: r.created_at
        }));
        res.json(vendors);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const createVendor = async (req, res) => {
    const { companyName, contactPerson, email, phone, address, rating, status } = req.body;
    const id = uuidv4();
    const newVendor = {
        id, companyName, contactPerson, email, phone, address, rating: rating || 5, status: status || 'Active'
    };

    try {
        const result = await dbAdapter.purchasing.createVendor(newVendor);
        res.status(201).json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateVendor = async (req, res) => {
    const data = req.body.updates || req.body;
    if (!data || Object.keys(data).length === 0) return res.json({});

    try {
        const result = await dbAdapter.purchasing.updateVendor(req.params.id, data);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteVendor = async (req, res) => {
    try {
        await dbAdapter.purchasing.deleteVendor(req.params.id);
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ... POs and Bills logic to be added if strictly required, but for "Complete Backend" 
// adhering to the mockDataService structure, Vendors is the main CRUD there for now.
// The task plan lists "Implement Purchasing Module (Vendors, POs)".

// --- Purchase Orders (POs) ---
export const getPurchaseOrders = async (req, res) => {
    try {
        const rows = await dbAdapter.purchasing.getPurchaseOrders();
        // adapter returns snake_case from supabase usually, or whatever select returns.
        // Controller expects camelCase for frontend.
        const pos = rows.map(r => ({
            id: r.id,
            poNumber: r.po_number || r.poNumber,
            vendor: r.vendor,
            date: r.date,
            expectedDate: r.expected_date || r.expectedDate,
            amount: r.amount,
            status: r.status
        }));
        res.json(pos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const createPurchaseOrder = async (req, res) => {
    const { vendor, vendorId, date, expectedDate, amount, status } = req.body;
    const id = uuidv4();
    const poNumber = `PO-${Math.floor(10000 + Math.random() * 90000)}`;
    const newPO = {
        id, poNumber, vendor, vendorId, date, expectedDate, amount, status: status || 'Draft'
    };

    try {
        const result = await dbAdapter.purchasing.createPurchaseOrder(newPO);
        res.status(201).json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updatePurchaseOrder = async (req, res) => {
    const data = req.body.updates || req.body;
    if (!data || Object.keys(data).length === 0) return res.json({});

    try {
        const result = await dbAdapter.purchasing.updatePurchaseOrder(req.params.id, data);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const deletePurchaseOrder = async (req, res) => {
    try {
        await dbAdapter.purchasing.deletePurchaseOrder(req.params.id);
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- Bills ---
export const getBills = async (req, res) => {
    try {
        const rows = await dbAdapter.purchasing.getBills();
        const bills = rows.map(r => ({
            id: r.id,
            billNumber: r.bill_number || r.billNumber,
            vendor: r.vendor,
            date: r.date,
            dueDate: r.due_date || r.dueDate,
            amount: r.amount,
            status: r.status
        }));
        res.json(bills);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const createBill = async (req, res) => {
    const { vendor, vendorId, billNumber, date, dueDate, amount, status } = req.body;
    const id = uuidv4();
    // Use provided billNumber or fallback (though frontend sends it)
    const finalBillNumber = billNumber || `BILL-${Math.floor(10000 + Math.random() * 90000)}`;

    const newBill = {
        id,
        billNumber: finalBillNumber,
        vendor,
        vendorId, // Pass the ID for DB relation
        date,
        dueDate,
        amount,
        status: status || 'Pending'
    };

    try {
        const result = await dbAdapter.purchasing.createBill(newBill);
        res.status(201).json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateBill = async (req, res) => {
    const data = req.body.updates || req.body;
    if (!data || Object.keys(data).length === 0) return res.json({});

    try {
        const result = await dbAdapter.purchasing.updateBill(req.params.id, data);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteBill = async (req, res) => {
    try {
        await dbAdapter.purchasing.deleteBill(req.params.id);
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteAllVendors = async (req, res) => {
    try {
        await dbAdapter.purchasing.deleteAllVendors();
        res.json({ message: 'All vendors deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteAllPurchaseOrders = async (req, res) => {
    try {
        await dbAdapter.purchasing.deleteAllPurchaseOrders();
        res.json({ message: 'All purchase orders deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteAllBills = async (req, res) => {
    try {
        await dbAdapter.purchasing.deleteAllBills();
        res.json({ message: 'All bills deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
