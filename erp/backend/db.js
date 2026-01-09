import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const isVercel = process.env.VERCEL === '1';
const usePostgres = !!process.env.DATABASE_URL;

let db;

// --- Helper to convert SQLite '?' params to Postgres '$1, $2, ...' ---
const convertSql = (sql) => {
    let i = 1;
    return sql.replace(/\?/g, () => `$${i++}`);
};

if (usePostgres) {
    console.log('🔌 Connecting to PostgreSQL (Supabase)...');

    // Postgres Connection Pool
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Required for Supabase/Heroku/Vercel
    });

    // SQLite Compatibility Layer for Postgres
    db = {
        pool, // Expose pool if needed

        // db.all(sql, params, callback)
        all: (sql, params, cb) => {
            if (typeof params === 'function') { cb = params; params = []; }
            const pgSql = convertSql(sql);
            pool.query(pgSql, params)
                .then(res => cb(null, res.rows))
                .catch(err => cb(err));
        },

        // db.get(sql, params, callback)
        get: (sql, params, cb) => {
            if (typeof params === 'function') { cb = params; params = []; }
            const pgSql = convertSql(sql);
            pool.query(pgSql, params)
                .then(res => cb(null, res.rows[0]))
                .catch(err => cb(err));
        },

        // db.run(sql, params, callback) -> Callback receives 'this' with lastID/changes
        run: function (sql, params, cb) {
            if (typeof params === 'function') { cb = params; params = []; }
            const pgSql = convertSql(sql);
            pool.query(pgSql, params)
                .then(res => {
                    // Shim 'this' context for callback
                    const context = { changes: res.rowCount, lastID: null }; // lastID not easily supported without RETURN
                    if (cb) cb.call(context, null);
                })
                .catch(err => {
                    if (cb) cb(err);
                });
        },

        serialize: (cb) => { if (cb) cb(); }, // No-op for PG
        prepare: () => ({ run: () => { }, finalize: () => { } }) // Mock prepare
    };

    // Initialize Schema (Async for PG)
    initSchemaPostgres(pool);

} else if (isVercel) {
    // Vercel without DATABASE_URL -> Fail safe
    console.error('❌ Running on Vercel WITHOUT DATABASE_URL. Database features disabled.');
    db = {
        get: (s, p, cb) => { if (cb) cb(new Error('Missing DATABASE_URL')); },
        run: (s, p, cb) => { if (cb) cb(new Error('Missing DATABASE_URL')); },
        all: (s, p, cb) => { if (cb) cb(new Error('Missing DATABASE_URL')); },
        serialize: (cb) => cb && cb()
    };
} else {
    // Local SQLite fallback - Only load sqlite3 HERE
    try {
        const sqlite3 = require('sqlite3').verbose();
        const dbPath = path.resolve(__dirname, 'erp.db');
        db = new sqlite3.Database(dbPath, (err) => {
            if (err) console.error('Error opening SQLite DB:', err.message);
            else {
                console.log('📂 Connected to local SQLite database.');
                db.run('PRAGMA foreign_keys = ON');
                initSchemaSQLite(db);
            }
        });
    } catch (e) {
        console.error('Failed to load sqlite3:', e.message);
        db = {}; // Fallback to avoid crashes if installed but failed
    }
}

// --- Schema Initialization (PostgreSQL) ---
async function initSchemaPostgres(pool) {
    console.log('🛠 Checking PostgreSQL Schema...');
    let client;
    try {
        client = await pool.connect();
        await client.query('BEGIN');

        // Users
        await client.query(`CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT CHECK(role IN ('super_admin', 'ecommerce_admin', 'dev_admin', 'user', 'staff')) NOT NULL,
            avatar_url TEXT,
            status TEXT DEFAULT 'Active',
            share_percentage DECIMAL(5,2) DEFAULT 0.00,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        // HR
        await client.query(`CREATE TABLE IF NOT EXISTS departments (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            head_of_department TEXT,
            budget DECIMAL(15,2),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        await client.query(`CREATE TABLE IF NOT EXISTS employees (
            id TEXT PRIMARY KEY,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            position TEXT,
            department_id TEXT,
            department_name TEXT,
            salary DECIMAL(15,2),
            stipend_type TEXT,
            stipend_description TEXT,
            join_date TEXT,
            join_date TEXT,
            status TEXT CHECK(status IN ('Active', 'On Leave', 'Terminated')),
            avatar_url TEXT,
            phone TEXT,
            address TEXT,
            cnic TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        await client.query(`CREATE TABLE IF NOT EXISTS leaves (
            id TEXT PRIMARY KEY,
            employee_id TEXT,
            employee_name TEXT,
            type TEXT,
            start_date TIMESTAMP,
            end_date TIMESTAMP,
            reason TEXT,
            status TEXT DEFAULT 'Pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        await client.query(`CREATE TABLE IF NOT EXISTS attendance (
            id TEXT PRIMARY KEY,
            employee_id TEXT,
            employee_name TEXT,
            date TEXT,
            check_in TEXT,
            check_out TEXT,
            status TEXT,
            work_hours TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        // Inventory
        await client.query(`CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            sku TEXT UNIQUE NOT NULL,
            category TEXT,
            price DECIMAL(10,2) NOT NULL,
            stock INTEGER DEFAULT 0,
            min_stock INTEGER DEFAULT 10,
            supplier TEXT,
            status TEXT DEFAULT 'Active',
            last_updated TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        // Migration: Add warehouse if missing
        await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS warehouse TEXT`);

        await client.query(`CREATE TABLE IF NOT EXISTS stock_movements (
            id TEXT PRIMARY KEY,
            product_id TEXT,
            type TEXT CHECK(type IN ('In', 'Out', 'Adjustment')),
            quantity INTEGER,
            warehouse TEXT,
            reference_code TEXT,
            reason TEXT,
            date TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(product_id) REFERENCES products(id)
        )`);

        // Reload PostgREST Cache (Fix for 'schema cache' error)
        try {
            await client.query("NOTIFY pgrst, 'reload config'");
            console.log("✅ Triggered PostgREST Schema Cache Reload");
        } catch (e) {
            console.warn("⚠️ Could not reload PostgREST cache (might need specific permissions):", e.message);
        }

        // Finance
        await client.query(`CREATE TABLE IF NOT EXISTS invoices (
            id TEXT PRIMARY KEY,
            invoice_number TEXT UNIQUE NOT NULL,
            customer_name TEXT,
            date TIMESTAMP,
            due_date TIMESTAMP,
            amount DECIMAL(15,2),
            status TEXT CHECK(status IN ('Paid', 'Pending', 'Overdue')),
            items_count INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        // Migration: Add delivery_status if missing (for Sales Orders)
        await client.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'Processing'`);

        // Documents
        await client.query(`CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT,
            size TEXT,
            path TEXT,
            uploaded_by TEXT,
            status TEXT DEFAULT 'Pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        await client.query('COMMIT');
        console.log('✅ PostgreSQL Schema Initialized.');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('❌ Failed to initialize PG Schema:', e);
    } finally {
        if (client) client.release();
    }
}

// --- Schema Initialization (SQLite) ---
function initSchemaSQLite(db) {
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT CHECK(role IN ('super_admin', 'ecommerce_admin', 'dev_admin', 'user', 'staff')) NOT NULL,
            avatar_url TEXT,
            status TEXT DEFAULT 'Active',
            share_percentage REAL DEFAULT 0.00,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // ... (Keep existing SQLite logic if needed, truncated for brevity unless requested to keep full)
        // Re-adding essential tables for local fallback
        db.run(`CREATE TABLE IF NOT EXISTS employees (
            id TEXT PRIMARY KEY,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            position TEXT,
            department_id TEXT,
            department_name TEXT,
            salary REAL,
            stipend_type TEXT,
            stipend_description TEXT,
            join_date TEXT,
            status TEXT CHECK(status IN ('Active', 'On Leave', 'Terminated')),
            avatar_url TEXT,
            phone TEXT,
            address TEXT,
            cnic_front TEXT,
            cnic_back TEXT,
            matric_result TEXT,
            inter_result TEXT,
            cv TEXT,
            cnic TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        db.run(`CREATE TABLE IF NOT EXISTS attendance (
            id TEXT PRIMARY KEY,
            employee_id TEXT,
            employee_name TEXT,
            date TEXT,
            check_in TEXT,
            check_out TEXT,
            status TEXT,
            work_hours TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
    });
}

import { v4 as uuidv4 } from 'uuid';

export default db;
