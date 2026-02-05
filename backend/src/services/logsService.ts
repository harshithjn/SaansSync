
import { requireAdminClient } from '../config/supabaseClient'
import { calculateDailyScore, getRiskLevel } from '../scoring/scoringEngine'
import { canLogToday } from './patientService'
// @ts-ignore
import { DailyLogSubmission } from '../types/shared'
import * as alertService from './alertService'
import * as doctorService from './doctorService'

export async function createDailyLog(payload: {
  patientId: string
  diseaseType: string
  commonData: any
  diseaseSpecificData: any
}) {
  const admin = requireAdminClient()
  const { patientId, diseaseType, commonData, diseaseSpecificData } = payload

  // 1. Check if already logged today
  //   const canLog = await canLogToday(patientId) 
  //   if (!canLog) {
  //     throw new Error('Daily logging limit reached (1 log per day)')
  //   }

  // 1. Prepare submission object
  const submission: DailyLogSubmission = {
    patientId,
    diseaseType,
    common: commonData,
    specific: diseaseSpecificData
  }

  // 2. Evaluate Alert & Score (Using new separate service)
  // This handles History Fetching, Weighted Average, and Alert Persistence internally.
  const evaluation = await alertService.evaluateAndStoreAlert(patientId, diseaseType, submission);

  const today = new Date().toISOString().split('T')[0]

  // 3. Prepare Data for Log Storage
  const diseaseData = {
    common: commonData,
    specific: diseaseSpecificData,
    scored_at: new Date().toISOString(),
    raw_score: evaluation.score, // Storing final weighted score as the daily reference
    drivers: evaluation.drivers
  }

  // 4. Insert Daily Log
  const { data: logData, error: logError } = await admin
    .from('daily_logs')
    .insert({
      patient_id: patientId,
      log_date: today,
      disease_type: diseaseType,
      disease_data: diseaseData,
      red_flag_score: evaluation.score
    })
    .select()
    .single()

  if (logError) throw logError

  // 5. Update Patient Folder Color (Doctor Dashboard)
  try {
    const { data: patient } = await admin
      .from('patients')
      .select('doctor_id, full_name')
      .eq('id', patientId)
      .single()

    if (patient?.doctor_id) {
      // Map Risk Level to Folder Color
      let folderColor = 'green';
      if (evaluation.level === 'RED') folderColor = 'red';
      else if (evaluation.level === 'ORANGE') folderColor = 'orange';
      else if (evaluation.level === 'YELLOW') folderColor = 'yellow';

      try {
        await doctorService.updatePatientFolder(patient.doctor_id, patientId, {
          redFlagScore: evaluation.score,
          folderColor: folderColor
        })
      } catch (e) {
        console.error('Failed to update patient folder, trying upsert', e);
        await doctorService.upsertPatientFolder({
          patientId,
          doctorId: patient.doctor_id,
          fullName: patient.full_name,
          age: 0,
          diseaseType,
          lastLogDate: today,
          folderColor: folderColor,
          redFlagScore: evaluation.score,
          alertCount: 1
        })
      }
    }
  } catch (e) {
    console.error('Non-critical secondary update failed (folders):', e);
    // Continue despite folder failure
  }

  // Return structure compatible with frontend expectation
  return {
    logEntry: logData,
    alert: evaluation.level !== 'GREEN' ? { level: evaluation.level, score: evaluation.score, drivers: evaluation.drivers } : null,
    score: evaluation.score,
    drivers: evaluation.drivers
  }
}

export async function getPatientLogs(patientId: string) {
  const admin = requireAdminClient()
  const { data, error } = await admin
    .from('daily_logs')
    .select('*')
    .eq('patient_id', patientId)
    .order('log_date', { ascending: false })

  if (error) throw error
  return data
}
