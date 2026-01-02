import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('❌ Missing URL or Service Key in .env');
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
    } else {
        console.error('❌ "documents" bucket MISSING!');
        console.log('   Creating "documents" bucket...');
        const { error: createError } = await supabase.storage.createBucket('documents', {
            public: false // Private by default, usage via Signed URLs? Backend generates signed URLs so Private is good.
        });
        if (createError) {
            console.error('   Failed to create bucket:', createError.message);
        } else {
            console.log('   ✅ "documents" bucket created successfully.');
        }
    }
}

checkBuckets();
