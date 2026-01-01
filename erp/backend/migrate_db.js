import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'erp.db');
const db = new sqlite3.Database(dbPath);

console.log('Migrating DB at:', dbPath);

const columnsToAdd = [
    { name: 'stipend_type', type: 'TEXT' },
    { name: 'stipend_description', type: 'TEXT' },
    { name: 'cnic_front', type: 'TEXT' },
    { name: 'cnic_back', type: 'TEXT' },
    { name: 'matric_result', type: 'TEXT' },
    { name: 'inter_result', type: 'TEXT' },
    { name: 'cv', type: 'TEXT' }
];

// Helper wrapper for async database run
const dbRun = (sql) => {
    return new Promise((resolve, reject) => {
        db.run(sql, (err) => {
            if (err) resolve({ success: false, error: err });
            else resolve({ success: true });
        });
    });
};

const runMigration = async () => {
    for (const col of columnsToAdd) {
        // Try adding column, ignore if exists
        console.log(`Checking/Adding ${col.name}...`);
        const result = await dbRun(`ALTER TABLE employees ADD COLUMN ${col.name} ${col.type}`);
        if (!result.success) {
            if (result.error.message.includes('duplicate column')) {
                console.log(`- ${col.name} already exists.`);
            } else {
                console.error(`Error adding ${col.name}:`, result.error.message);
            }
        } else {
            console.log(`✓ Added ${col.name}`);
        }
    }

    db.close((err) => {
        if (err) console.error('Error closing DB:', err.message);
        else console.log('Database connection closed.');
    });
};

runMigration();
