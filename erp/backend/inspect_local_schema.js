import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'erp.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);

const tables = ['users', 'customers', 'products', 'employees', 'leaves', 'attendance', 'transactions', 'invoices', 'payments', 'employee_history'];

const inspect = async () => {
    console.log("--- Schema Inspection ---");
    for (const table of tables) {
        await new Promise(resolve => {
            db.all(`PRAGMA table_info(${table})`, [], (err, rows) => {
                if (err) console.log(`Error reading ${table}:`, err.message);
                else {
                    console.log(`\nTable: ${table}`);
                    console.log(rows.map(r => `${r.name} (${r.type})`).join(', '));
                }
                resolve();
            });
        });
    }
    db.close();
};

inspect();
