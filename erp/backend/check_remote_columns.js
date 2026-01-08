import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase Credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    console.log("Checking remote schema for 'products' table...");

    // Using RPC if strictly needed, but let's try direct query if possible, 
    // or just use supabase-js to select specific column and see error.

    // Better: Attempt to insert/update a dummy row with warehouse? No, destructive.
    // Let's try to SELECT "warehouse" explicitly.

    const { data, error } = await supabase
        .from('products')
        .select('warehouse')
        .limit(1);

    if (error) {
        console.error("❌ Error selecting 'warehouse':", error.message);
        if (error.message.includes('schema cache')) {
            console.log("👉 Confirmed: Schema Cache believes column is missing.");
        } else if (error.message.includes('column "warehouse" does not exist')) {
            console.log("👉 Confirmed: Column DOES NOT EXIST in Database.");
        }
    } else {
        console.log("✅ Column 'warehouse' is accessible via API.", data);
    }
}

checkColumns();
