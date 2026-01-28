const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

async function verify() {
    console.log('--- SpendAI Connection Verifier ---');

    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;

    if (!url || !key) {
        console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in backend/.env');
        return;
    }

    const supabase = createClient(url, key);

    console.log('Testing connection...');
    const { data, error } = await supabase.from('organizations').select('count').limit(1);

    if (error) {
        if (error.message.includes('recursion')) {
            console.error('❌ RECURSION ERROR: You still need to run the SQL fix in Supabase!');
        } else {
            console.error('❌ DB ERROR:', error.message);
        }
    } else {
        console.log('✅ DATABASE CONNECTED! Bypassing RLS successful.');
    }

    const { data: userData, error: userError } = await supabase.from('users').select('id, email, organization_id').limit(1);
    if (userError) {
        console.error('❌ USER TABLE ERROR:', userError.message);
    } else {
        console.log('✅ USER TABLE ACCESSIBLE!');
        console.log('User Snippet:', JSON.stringify(userData, null, 2));
    }
}

verify();
