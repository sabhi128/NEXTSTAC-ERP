import sqlite3 from 'sqlite3';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Setup Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY; // Must use Service Role for full access (bypass RLS if any)

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Setup Error: Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 2. Setup SQLite
const dbPath = path.join(__dirname, 'erp.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error("❌ SQLite connection error:", err.message);
        process.exit(1);
    }
    console.log("📂 Connected to local SQLite database.");
});

// Helper to get data from SQLite
const getTableData = (table) => {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM ${table}`, [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

// Main Sync Function
const syncTable = async (tableName, transformFn = null) => {
    console.log(`\n⏳ Syncing [${tableName}]...`);
    try {
        const rows = await getTableData(tableName);
        if (rows.length === 0) {
            console.log(`   - No data in local ${tableName}. Skipping.`);
            return;
        }

        console.log(`   - Found ${rows.length} records locally.`);

        // Transform if needed (e.g. map snake_case or fix dates)
        const payload = transformFn ? rows.map(transformFn) : rows;

        // Upsert to Supabase
        const { error } = await supabase.from(tableName).upsert(payload);

        if (error) {
            console.error(`   ❌ Failed to sync ${tableName}:`, error.message);
        } else {
            console.log(`   ✅ Successfully synced ${tableName}.`);
        }
    } catch (err) {
        if (err.message && err.message.includes('no such table')) {
            console.log(`   - Local table '${tableName}' does not exist. Skipping.`);
        } else {
            console.error(`   ❌ Error processing ${tableName}:`, err);
        }
    }
};

const run = async () => {
    console.log("🚀 Starting Data Sync (SQLite -> Supabase)...\n");

    // Order matters for Foreign Keys
    // 1. Users & Customers & Products (Independent)
    await syncTable('users');
    await syncTable('customers');
    await syncTable('products');

    // 2. Employees (Independent mostly, but referenced by others)
    await syncTable('employees', (row) => {
        const { share_percentage, ...rest } = row; // Explicitly remove share_percentage
        return {
            ...rest,
            // sanitize numeric fields
            salary: row.salary === '' ? null : row.salary,
        };
    });

    // 3. Dependent Tables
    await syncTable('leaves');
    await syncTable('attendance');
    await syncTable('transactions');
    await syncTable('invoices');
    await syncTable('payments');

    // 4. Promotions History
    await syncTable('employee_history');

    console.log("\n✨ Sync Complete! Check your Vercel app now.");
    db.close();
};

run();
