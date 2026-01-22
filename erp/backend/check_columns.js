
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

// Mock Vercel for dbAdapter to use Supabase
process.env.VERCEL = '1';

import { supabaseAdmin } from './supabaseClient.js';

async function checkColumns() {
    console.log("Checking 'bills' table columns...");

    // We can't easily DESCRIBE table via JS client, but we can try to select 'created_at'
    const { data, error } = await supabaseAdmin
        .from('bills')
        .select('created_at')
        .limit(1);

    if (error) {
        console.error("Error selecting created_at:", error);
        if (error.message.includes("does not exist")) {
            console.log("CONFIRMED: created_at column is MISSING.");
        }
    } else {
        console.log("Success: created_at column EXISTS.");
    }

    // Also check vendors relation
    console.log("Checking 'vendors' relation...");
    const { data: relData, error: relError } = await supabaseAdmin
        .from('bills')
        .select('*, vendors(company_name)')
        .limit(1);

    if (relError) {
        console.error("Error joining vendors:", relError);
    } else {
        console.log("Success: vendors relation works.");
    }
}

checkColumns();
