import dbAdapter from '../dbAdapter.js';
import { v4 as uuidv4 } from 'uuid';

export const getProducts = async (req, res) => {
    try {
        const rows = await dbAdapter.inventory.getProducts();

        const products = rows.map(r => ({
            id: r.id,
            name: r.name,
            sku: r.sku,
            category: r.category,
            price: r.price,
            stock: r.stock,
            minStock: r.min_stock || r.minStock,
            warehouse: r.warehouse,
            supplier: r.supplier,
            status: r.status,
            lastUpdated: r.last_updated || r.lastUpdated || r.created_at
        }));

        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const createProduct = async (req, res) => {
    const { name, sku, category, price, stock, minStock, status, supplier, warehouse } = req.body;
    const id = uuidv4();
    const lastUpdated = new Date().toISOString();

    const newProduct = {
        id,
        name,
        sku,
        category,
        price,
        stock: stock || 0,
        minStock: minStock || 10,
        warehouse: warehouse || 'Main Warehouse',
        status: status || 'Active',
        supplier,
        lastUpdated
    };

    try {
        const savedProduct = await dbAdapter.inventory.createProduct(newProduct);
        res.status(201).json(savedProduct);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateProduct = async (req, res) => {
    // Expect updates in req.body.updates or req.body directly
    const data = req.body.updates || req.body;

    if (!data || Object.keys(data).length === 0) {
        return res.json({});
    }

    try {
        const updatedProduct = await dbAdapter.inventory.updateProduct(req.params.id, data);

        // Normalize return
        const normalized = {
            id: updatedProduct.id,
            name: updatedProduct.name,
            sku: updatedProduct.sku,
            category: updatedProduct.category,
            price: updatedProduct.price,
            stock: updatedProduct.stock,
            minStock: updatedProduct.min_stock || updatedProduct.minStock,
            warehouse: updatedProduct.warehouse,
            supplier: updatedProduct.supplier,
            status: updatedProduct.status,
            lastUpdated: updatedProduct.last_updated || updatedProduct.lastUpdated
        };

        res.json(normalized);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        await dbAdapter.inventory.deleteProduct(req.params.id);
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
// Bulk Delete Products
export const deleteAllProducts = async (req, res) => {
    try {
        await dbAdapter.inventory.deleteAllProducts();
        res.json({ message: 'All products deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Stock Movements
export const getStockMovements = async (req, res) => {
    try {
        const rows = await dbAdapter.inventory.getStockMovements();
        const movements = rows.map(r => ({
            id: r.id,
            productId: r.product_id,
            productName: r.product_name || r.products?.name || 'Unknown Product',
            type: r.type,
            quantity: r.quantity,
            warehouse: r.warehouse,
            date: r.date,
            reference: r.reference_code || r.reference,
            reason: r.reason
        }));
        res.json(movements);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const addStockMovement = async (req, res) => {
    let { productId } = req.body;
    const { productName, type, quantity, warehouse, reference, notes, date } = req.body;

    // If productId is missing, try to find by name
    if (!productId && productName) {
        try {
            const product = await dbAdapter.inventory.findProductByName(productName);
            if (product) {
                productId = product.id;
            } else {
                return res.status(404).json({ error: `Product '${productName}' not found. Please create it first.` });
            }
        } catch (err) {
            return res.status(500).json({ error: "Error looking up product: " + err.message });
        }
    }

    if (!productId) {
        return res.status(400).json({ error: "Product is required. Please type an existing product name." });
    }

    const id = uuidv4();
    const movement = {
        id,
        productId,
        type,
        quantity,
        warehouse,
        reference,
        reason: notes,
        date: date || new Date().toISOString()
    };

    try {
        const result = await dbAdapter.inventory.addStockMovement(movement);
        res.status(201).json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateStockMovement = async (req, res) => {
    const data = req.body;
    try {
        const result = await dbAdapter.inventory.updateStockMovement(req.params.id, data);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteStockMovement = async (req, res) => {
    try {
        await dbAdapter.inventory.deleteStockMovement(req.params.id);
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteAllStockMovements = async (req, res) => {
    try {
        await dbAdapter.inventory.deleteAllStockMovements();
        res.json({ message: 'All stock movements deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Warehouses
export const getWarehouses = async (req, res) => {
    try {
        const rows = await dbAdapter.inventory.getWarehouses();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const addWarehouse = async (req, res) => {
    const { name, location, capacity, status } = req.body;
    const id = uuidv4();
    const warehouse = {
        id,
        name,
        location,
        capacity,
        status: status || 'Active'
    };

    try {
        const result = await dbAdapter.inventory.addWarehouse(warehouse);
        res.status(201).json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateWarehouse = async (req, res) => {
    const data = req.body.data || req.body; // Handle { data: ... } or direct body
    try {
        const result = await dbAdapter.inventory.updateWarehouse(req.params.id, data);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteWarehouse = async (req, res) => {
    try {
        await dbAdapter.inventory.deleteWarehouse(req.params.id);
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteAllWarehouses = async (req, res) => {
    try {
        await dbAdapter.inventory.deleteAllWarehouses();
        res.json({ message: 'All warehouses deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
