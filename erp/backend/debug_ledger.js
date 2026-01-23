
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('--- Ledger Debugger ---');
console.log('URL:', supabaseUrl ? 'Set' : 'Missing');
console.log('Service Key:', serviceRoleKey ? 'Set' : 'Missing');

if (!supabaseUrl || !serviceRoleKey) {
    console.error('CRITICAL: Missing Supabase Env Vars. Cannot debug.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const run = async () => {
    try {
        console.log('\n1. Checking connection...');
        const { data: users, error: userError } = await supabase.from('users').select('id').limit(1);
        if (userError) {
            console.error('Connection Failed (Users check):', userError.message);
        } else {
            console.log('Connection OK. Found users:', users?.length ?? 0);
        }

        console.log('\n2. Checking finance_accounts table...');
        const { data: accounts, error: accError } = await supabase.from('finance_accounts').select('*');

        if (accError) {
            console.error('FAIL: finance_accounts scan failed:', accError.message);
            if (accError.code === '42P01') {
                console.error('--> TABLE DOES NOT EXIST. Run the migration SQL!');
            }
        } else {
            console.log(`SUCCESS: Found ${accounts.length} accounts.`);
            if (accounts.length > 0) {
                console.log('Sample:', accounts[0].name);
            } else {
                console.log('--> Table exists but is EMPTY. Seeding should have triggered.');
            }
        }

    } catch (e) {
        console.error('Unexpected Error:', e);
    }
};

run();
