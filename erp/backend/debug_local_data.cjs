const dbAdapter = require('./dbAdapter');
const db = require('./db');
// Do NOT require server.js to avoid EADDRINUSE

async function debugLocalData() {
    console.log("--- Debugging Local Data ---");

    // 1. Check dbAdapter structure
    console.log("Checking dbAdapter.inventory...");
    if (!dbAdapter.inventory) {
        console.error("❌ dbAdapter.inventory is UNDEFINED!");
        // Check if methods are on dbAdapter directly
        if (dbAdapter.findProductByName) {
            console.log("👉 Methods found on dbAdapter root (alias missing or incorrect).");
            // Fix for this session if needed for testing
            dbAdapter.inventory = dbAdapter;
        } else {
            console.log("❌ Methods NOT found on dbAdapter root either.");
        }
    } else {
        console.log("✅ dbAdapter.inventory exists.");
        console.log("Has getStockMovements?", !!dbAdapter.inventory.getStockMovements);
        console.log("Has findProductByName?", !!dbAdapter.inventory.findProductByName);
    }

    // 2. Check Database Tables
    console.log("\nChecking SQLite Tables...");
    // db.js typically initializes the DB connection automatically on require
    db.serialize(() => {
        db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
            if (err) {
                console.error("❌ Error fetching tables:", err.message);
                return;
            }
            const tableNames = tables.map(t => t.name);
            console.log("Tables found:", tableNames.join(', '));

            if (!tableNames.includes('products')) console.error("❌ 'products' table MISSING!");
            if (!tableNames.includes('stock_movements')) console.error("❌ 'stock_movements' table MISSING!");

            // 3. Try fetching data
            if (tableNames.includes('products')) {
                db.all("SELECT * FROM products LIMIT 5", [], (err, rows) => {
                    if (err) console.error("❌ Error querying products:", err.message);
                    else {
                        console.log(`✅ Products found: ${rows.length}`);
                        if (rows.length > 0) console.log(rows[0]);
                    }
                });
            }

            if (tableNames.includes('stock_movements')) {
                db.all("SELECT * FROM stock_movements LIMIT 5", [], (err, rows) => {
                    if (err) console.error("❌ Error querying stock_movements:", err.message);
                    else {
                        console.log(`✅ Stock Movements found: ${rows.length}`);
                        if (rows.length > 0) console.log(rows[0]);
                    }
                });
            }
        });
    });
}

// Give it a moment for DB connection
setTimeout(debugLocalData, 1000);
