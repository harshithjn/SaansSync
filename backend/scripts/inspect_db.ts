
import 'dotenv/config';
import * as patientService from '../src/services/patientService';

async function run() {
    console.log('--- FINAL SERVICE TEST START ---');
    const patientId = '14f5a404-d8c1-4d3e-8d29-11b6dc648fa2';

    try {
        const logs = await patientService.getPatientLogs(patientId);
        console.log(`Service returned ${logs.length} logs.`);
        if (logs.length > 0) {
            console.log('First log mapped data:', JSON.stringify({
                id: logs[0].id,
                date: logs[0].date,
                spo2: logs[0].spo2,
                spo2_at_rest: logs[0].spo2_at_rest,
                mmrc_scale: logs[0].mmrc_scale,
                pefr: logs[0].pefr
            }, null, 2));
        }
    } catch (error: any) {
        console.error('Service error:', error.message);
    }

    console.log('--- END ---');
}

run();
