
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) process.exit(1);

const supabase = createClient(url, key);

async function inspectPolicies() {
    console.log('Inspecting policies for "messages" table...');
    const { data, error } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'messages');

    if (error) {
        // pg_policies is a system view, might not be accessible via API directly unless we have high privs or call rpc
        console.error('Error fetching policies via API:', error);

        // Try to infer by just checking if we can select
        console.log('Attempting to select from messages...');
        const { error: selectError } = await supabase.from('messages').select('count').limit(1);
        if (selectError) console.error('Select error:', selectError);
        else console.log('Select successful (Service Role has access)');
    } else {
        console.log('Policies:', JSON.stringify(data, null, 2));
    }
}

inspectPolicies();
