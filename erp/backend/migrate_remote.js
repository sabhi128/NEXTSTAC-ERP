import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Use connection string from env
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("❌ Missing DATABASE_URL (for Postgres connection). Check .env");
    process.exit(1);
}

const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false } // Required for Supabase/Vercel mostly
});

async function migrate() {
    try {
        await client.connect();
        console.log("📂 Connected to Remote Postgres.");

        console.log("🛠 Adding 'warehouse' column...");
        await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS warehouse TEXT`);
        console.log("✅ Column 'warehouse' added.");

        console.log("🛠 Reloading Schema Cache...");
        try {
            await client.query("NOTIFY pgrst, 'reload config'");
            console.log("✅ Cache Reload Notified.");
        } catch (e) {
            console.log("⚠️ Cache reload notify failed (ignorable):", e.message);
        }

    } catch (err) {
        console.error("❌ Migration Failed:", err);
    } finally {
        await client.end();
    }
}

migrate();
