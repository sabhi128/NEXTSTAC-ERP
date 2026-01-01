import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, 'erp.db');
console.log('Opening DB:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening DB:', err.message);
        process.exit(1);
    }
    console.log('Connected to DB.');
    checkTable();
});

function checkTable() {
    db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='attendance'", (err, rows) => {
        if (err) {
            console.error('Error checking table:', err);
            return;
        }
        console.log('Table existence check:', rows);

        if (rows.length === 0) {
            console.log('Creating table manually...');
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
            )`, (err) => {
                if (err) console.error('create table err', err);
                else {
                    console.log('Table created.');
                    insertTest();
                }
            });
        } else {
            insertTest();
        }
    });
}

function insertTest() {
    const id = 'test-' + Date.now();
    const sql = "INSERT INTO attendance (id, employee_id, employee_name, date, check_in, check_out, status, work_hours) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    const params = [id, 'emp-123', 'Test Employee', '2026-01-01', '09:00', '18:00', 'Present', '9'];

    // Use db.run directly (not prepare for simplicity in debug script)
    db.run(sql, params, function (err) {
        if (err) {
            console.error('Insert Failed:', err);
        } else {
            console.log('Insert Success. Reading back...');
            readTest();
        }
    });
}

function readTest() {
    db.all("SELECT * FROM attendance", (err, rows) => {
        if (err) console.error('Read Failed:', err);
        else console.log('Rows found:', rows);
    });
}
