import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function check() {
    const { data: docs, error: docError } = await supabase
        .from('api_documents')
        .select('*')
        .order('created_at', { ascending: false });

    console.log('--- API Documents ---');
    docs.forEach(d => console.log(`${d.id} | ${d.status} | ${d.title} | Error: ${d.error_message}`));

    const { data: apis, error: apiError } = await supabase
        .from('discovered_apis')
        .select('*');

    console.log('\n--- Discovered APIs ---');
    apis.forEach(a => console.log(`${a.id} | ${a.name} | Project: ${a.project_id}`));

    const { data: endpoints, error: epError } = await supabase
        .from('api_endpoints')
        .select('id, method, path, api_id');

    console.log('\n--- Endpoints Count ---');
    console.log(endpoints.length);
}

check();
