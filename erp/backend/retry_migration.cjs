const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'erp.db');

console.log(`Migrating database at: ${dbPath}`);
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // 1. Check/Add promotion_level
    db.all("PRAGMA table_info(employees)", (err, columns) => {
        if (err) {
            console.error("Error fetching table info:", err);
            process.exit(1);
        }

        const hasColumn = columns.some(c => c.name === 'promotion_level');
        if (!hasColumn) {
            console.log("Adding promotion_level column...");
            db.run("ALTER TABLE employees ADD COLUMN promotion_level TEXT", (err) => {
                if (err) console.error("Error adding column:", err);
                else console.log("Column added.");
            });
        } else {
            console.log("Column promotion_level already exists.");
        }
    });

    // 2. Create History Table
    console.log("Creating employee_history table...");
    db.run(`
        CREATE TABLE IF NOT EXISTS employee_history (
            id TEXT PRIMARY KEY,
            employee_id TEXT NOT NULL,
            old_position TEXT,
            old_level TEXT,
            old_salary TEXT,
            old_department TEXT,
            new_position TEXT,
            new_level TEXT,
            new_salary TEXT,
            new_department TEXT,
            change_date TEXT,
            changed_by TEXT,
            FOREIGN KEY (employee_id) REFERENCES employees(id)
        )
    `, (err) => {
        if (err) console.error("Error creating history table:", err);
        else console.log("History table ensured.");
    });
});

// db.close(); // Let it close on exit or handle carefully if needed.
