
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

// Force Vercel env
process.env.VERCEL = '1';

async function run() {
    // Dynamic import to ensure process.env is set
    const { default: dbAdapter } = await import('./dbAdapter.js');
    console.log("Testing deleteVendor on Supabase...");

    // 1. Get a vendor
    try {
        const vendors = await dbAdapter.purchasing.getVendors();
        if (vendors.length === 0) {
            console.log("No vendors found to delete.");
            return;
        }

        const targetVendor = vendors[0];
        console.log(`Attempting to delete vendor: ${targetVendor.companyName} (${targetVendor.id})`);

        // 2. Try to delete
        await dbAdapter.purchasing.deleteVendor(targetVendor.id);
        console.log("SUCCESS: Vendor deleted (Unexpected if FK exists)");

    } catch (err) {
        console.error("FAILURE: Could not delete vendor.");
        console.error("Error Message:", err.message);
        // Supabase/Postgres error structure usually has code
        if (err.code) console.error("Error Code:", err.code);
        else console.log("Checking for detailed error object...");
    }
}

run();
