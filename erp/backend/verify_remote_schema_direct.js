import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("❌ Missing DATABASE_URL.");
    process.exit(1);
}

const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function verify() {
    try {
        await client.connect();
        console.log("📂 Connected to Remote Postgres.");

        // Check if column exists in information_schema
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'products' AND column_name = 'warehouse';
        `);

        if (res.rows.length > 0) {
            console.log("✅ Column 'warehouse' EXISTS in Database.");
            console.log("Details:", res.rows[0]);
        } else {
            console.error("❌ Column 'warehouse' DOES NOT EXIST in Database.");
        }

        // Check if I can NOTIFY
        try {
            await client.query("NOTIFY pgrst, 'reload config'");
            console.log("✅ Sent NOTIFY pgrst, 'reload config'");
        } catch (e) {
            console.error("❌ Failed to NOTIFY:", e.message);
        }

    } catch (err) {
        console.error("❌ Connection/Query Failed:", err);
    } finally {
        await client.end();
    }
}

verify();
