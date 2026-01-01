import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, 'erp.db');

async function migrate() {
    console.log(`Migrating database at: ${dbPath}`);
    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    try {
        console.log("Checking if promotion_level exists...");
        const columns = await db.all(`PRAGMA table_info(employees)`);
        const hasColumn = columns.some(c => c.name === 'promotion_level');

        if (!hasColumn) {
            console.log("Adding promotion_level column...");
            await db.run(`ALTER TABLE employees ADD COLUMN promotion_level TEXT`);
            console.log("Column added.");
        } else {
            console.log("Column promotion_level already exists.");
        }

        console.log("Creating employee_history table...");
        await db.run(`
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
        `);
        console.log("History table ensured.");

    } catch (err) {
        console.error("Migration Failed:", err);
    } finally {
        await db.close();
    }
}

migrate();
