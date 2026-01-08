import db from './db.js';

console.log("🛠 Creating stock_movements table...");

const createTableSql = `
CREATE TABLE IF NOT EXISTS stock_movements (
    id TEXT PRIMARY KEY,
    product_id TEXT,
    type TEXT CHECK(type IN ('In', 'Out', 'Adjustment')),
    quantity INTEGER,
    warehouse TEXT,
    reference_code TEXT,
    reason TEXT,
    date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(product_id) REFERENCES products(id)
)
`;

db.serialize(() => {
    db.run(createTableSql, (err) => {
        if (err) {
            console.error("❌ Error creating table:", err.message);
        } else {
            console.log("✅ Table 'stock_movements' created successfully (with warehouse column).");
        }
    });

    // Verify it exists now
    db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='stock_movements'", [], (err, rows) => {
        if (err) console.error("Verify Error:", err);
        else console.log("Verification:", rows);
    });
});
