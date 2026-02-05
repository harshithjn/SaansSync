
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) process.exit(1);

const supabase = createClient(url, key);

async function checkDoctor() {
    // We need the doctor's Auth ID. Since I don't have it explicitly from the user's session in this context,
    // I will list all doctors and all auth users (limited) or just list doctors to see what's there.

    console.log('Checking Doctors table...');
    const { data: doctors, error: dErr } = await supabase.from('doctors').select('*');
    if (dErr) console.error('Error fetching doctors:', dErr);
    else console.log('Doctors found:', doctors?.length, doctors);

    // Let's also check messages table structure/constraints by trying to insert a dummy if possible, 
    // or just relying on the list above.
    // If the list is empty, that explains why ANY auth id fails.
}

checkDoctor();
