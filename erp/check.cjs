const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Manually load .env
try {
    const envConfig = dotenv.parse(fs.readFileSync(path.resolve(__dirname, '.env')));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
} catch (e) {
    console.warn('Could not read .env file');
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ubehzdfkjaouucvpcmso.supabase.co';
const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('Using URL:', supabaseUrl ? 'Found' : 'Missing');
console.log('Using Service Key:', serviceKey ? 'Found' : 'Missing');

if (!supabaseUrl || !serviceKey) {
    console.error('❌ Missing Credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function checkBuckets() {
    console.log('🔌 Connecting to Supabase Storage...');
    const { data, error } = await supabase.storage.listBuckets();

    if (error) {
        console.error('❌ Error listing buckets:', error.message);
        return;
    }

    console.log('📂 Found Buckets:', data.map(b => b.name));

    const docBucket = data.find(b => b.name === 'documents');
    if (docBucket) {
        console.log('✅ "documents" bucket exists.');
        console.log('   Public:', docBucket.public);

        // Also check if RLS policy allows uploads? 
        // Service Role bypasses RLS, so logic should be fine.
    } else {
        console.error('❌ "documents" bucket MISSING!');
        console.log('   Creating "documents" bucket...');
        const { error: createError } = await supabase.storage.createBucket('documents', {
            public: false
        });
        if (createError) {
            console.error('   Failed to create bucket:', createError.message);
        } else {
            console.log('   ✅ "documents" bucket created successfully.');
        }
    }
}

checkBuckets();
