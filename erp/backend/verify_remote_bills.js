
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

// Force Vercel env BEFORE importing dbAdapter
process.env.VERCEL = '1';

// Dynamic import to ensure process.env is set first
async function run() {
    const { default: dbAdapter } = await import('./dbAdapter.js');
    console.log("Testing getBills from Supabase...");

    try {
        const bills = await dbAdapter.purchasing.getBills();
        console.log("Bills retrieved:", bills.length);
        console.log(JSON.stringify(bills, null, 2));
    } catch (err) {
        console.error("Error fetching bills:", err);
    }
}

run();
