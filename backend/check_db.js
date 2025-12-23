import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

async function check() {
    console.log('Using URL:', process.env.SUPABASE_URL);

    const { data: docs, error: docError } = await supabase
        .from('api_documents')
        .select('*')
        .order('created_at', { ascending: false });

    if (docError) {
        console.error('Error fetching docs:', docError);
    } else {
        console.log('--- API Documents ---');
        docs.forEach(d => console.log(`${d.id} | ${d.status} | ${d.title} | Error: ${d.error_message}`));
    }

    const { data: apis, error: apiError } = await supabase
        .from('discovered_apis')
        .select('*');

    if (apiError) {
        console.error('Error fetching apis:', apiError);
    } else {
        console.log('\n--- Discovered APIs ---');
        apis.forEach(a => console.log(`${a.id} | ${a.name} | Project: ${a.project_id}`));
    }

    const { data: endpoints, error: epError } = await supabase
        .from('api_endpoints')
        .select('id, method, path, api_id');

    if (epError) {
        console.error('Error fetching endpoints:', epError);
    } else {
        console.log('\n--- Endpoints Count ---');
        console.log(endpoints ? endpoints.length : 0);
    }
}

check();
