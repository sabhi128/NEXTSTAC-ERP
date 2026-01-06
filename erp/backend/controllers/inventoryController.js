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
