import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_KEY environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

describe('Daily Logs Integration Flow', () => {
  let patientId: string;
  let logId: string;

  beforeAll(async () => {
    // Create a test patient
    const testPatient = {
      full_name: 'Test Patient for Logs (Vitest)',
      disease_type: 'Asthma',
      patient_data: {
        email: `test-logs-${Date.now()}@demo.com`, // Unique email
        password: 'patient123',
        created_at: new Date().toISOString(),
      },
    };

    const { data: patient, error } = await supabase
      .from('patient_profiles')
      .insert(testPatient)
      .select()
      .single();

    if (error) {
      throw new Error(`Patient creation failed: ${error.message}`);
    }

    patientId = patient.id;
    console.log('✅ Test patient created:', patientId);
  });

  afterAll(async () => {
    // Cleanup
    if (logId) {
      await supabase.from('daily_logs').delete().eq('id', logId);
    }
    if (patientId) {
      await supabase.from('patient_profiles').delete().eq('id', patientId);
    }
    console.log('🧹 Test data cleaned up');
  });

  it('should create a daily log for the patient', async () => {
    const testLog = {
      patient_id: patientId,
      log_date: new Date().toISOString().split('T')[0],
      spo2_at_rest: 95,
      spo2_on_exertion: 90,
      mmrc_scale: 2,
      disease_type: 'Asthma',
      disease_data: {
        peakFlow: 300,
        inhalerUse: 2,
      },
      symptoms: {
        cough: 3,
        breathlessness: 4,
      },
      medications: [],
      side_effects: [],
      aqi_data: { value: 50 },
      red_flag_score: 3,
    };

    const { data: log, error } = await supabase
      .from('daily_logs')
      .insert(testLog)
      .select()
      .single();

    expect(error).toBeNull();
    expect(log).toBeDefined();
    expect(log.patient_id).toBe(patientId);
    
    logId = log.id;
    console.log('✅ Daily log created successfully:', logId);
  });
});
