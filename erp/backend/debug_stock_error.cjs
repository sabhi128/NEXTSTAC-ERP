const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const sql = `
    SELECT sm.*, p.name as product_name
    FROM stock_movements sm
    LEFT JOIN products p ON sm.product_id = p.id
    ORDER BY sm.date DESC
`;

console.log("Testing Stock Movement Query...");

db.all(sql, [], (err, rows) => {
    if (err) {
        console.error("QUERY ERROR:", err.message);
    } else {
        console.log("Query Successful. Rows found:", rows.length);
        if (rows.length > 0) {
            console.log("First row:", rows[0]);
        }
    }

    // Also check table info
    db.all("PRAGMA table_info(stock_movements)", [], (err, cols) => {
        if (err) console.error("Could not get table info:", err);
        else console.log("stock_movements columns:", cols.map(c => c.name));
    });

    db.close();
});
