import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey) {
    try {
        supabase = createClient(supabaseUrl, supabaseKey);
    } catch (e) {
        console.error('Failed to initialize Supabase client:', e);
    }
} else {
    console.warn('Supabase URL or Key missing. Database operations will fail if VERCEL=1.');
}

const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
let supabaseAdmin = null;

if (supabaseUrl && serviceRoleKey) {
    try {
        supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
    } catch (e) {
        console.error('Failed to initialize Supabase Admin client:', e);
    }
}

export { supabaseAdmin };
export default supabase;
