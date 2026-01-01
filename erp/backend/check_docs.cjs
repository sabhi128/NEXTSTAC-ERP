const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'erp.db');
const db = new sqlite3.Database(dbPath);

db.all(`SELECT id, first_name, cnic_front, cnic_back, matric_result, inter_result, cv FROM employees`, [], (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log("Employees Document Data:");
        console.log(JSON.stringify(rows, null, 2));
    }
    db.close();
});
