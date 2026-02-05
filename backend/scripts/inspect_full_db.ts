
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url!, key!);

async function run() {
    const logFile = 'db_structure.log';
    const log = (msg: string) => {
        console.log(msg);
        fs.appendFileSync(logFile, msg + '\n');
    };

    if (fs.existsSync(logFile)) fs.unlinkSync(logFile);

    log('--- DB STRUCTURE LOG ---');

    const tables = ['patients', 'daily_logs', 'doctors', 'patient_folders', 'saanssync_alerts'];

    for (const table of tables) {
        log(`\nInspecting table: ${table}`);
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            log(`Error fetching ${table}: ${error.message}`);
            log(`Full Error: ${JSON.stringify(error)}`);
        } else if (data && data.length > 0) {
            log(`Columns for ${table}: ${Object.keys(data[0]).join(', ')}`);
        } else {
            log(`${table} is empty, trying dummy insert...`);
            const { data: dummy, error: insError } = await supabase.from(table).insert({}).select().limit(1);
            if (insError) {
                log(`Insert error for ${table}: ${insError.message}`);
            } else if (dummy && dummy.length > 0) {
                log(`Columns for ${table} (from dummy): ${Object.keys(dummy[0]).join(', ')}`);
                // cleanup dummy if it created one? unlikely with empty {}
            } else {
                log(`Could not determine columns for ${table}.`);
            }
        }
    }

    log('\n--- END LOG ---');
}

run();
