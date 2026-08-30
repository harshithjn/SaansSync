import prisma from '../config/db'
import { calculateDailyScore, getRiskLevel } from '../scoring/scoringEngine'

import { DailyLogSubmission } from '../types/shared'
import * as alertService from './alertService'
import * as doctorService from './doctorService'

export async function createDailyLog(payload: {
  patientId: string
  diseaseType: string
  commonData: any
  diseaseSpecificData: any
}) {
  const { patientId, diseaseType, commonData, diseaseSpecificData } = payload

  const submission: DailyLogSubmission = {
    patientId,
    diseaseType,
    common: commonData,
    specific: diseaseSpecificData
  }

  const evaluation = await alertService.evaluateAndStoreAlert(patientId, diseaseType, submission);

  const today = new Date().toISOString().split('T')[0]

  const diseaseData = {
    common: commonData,
    specific: diseaseSpecificData,
    scored_at: new Date().toISOString(),
    raw_score: evaluation.score,
    drivers: evaluation.drivers
  }

  const logData = await prisma.dailyLog.create({
    data: {
      patientId,
      logDate: new Date(today),
      diseaseType,
      diseaseData,
      redFlagScore: evaluation.score
    }
  });

  try {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { doctorId: true, fullName: true }
    });

    if (patient?.doctorId) {
      let folderColor = 'green';
      if (evaluation.level === 'RED') folderColor = 'red';
      else if (evaluation.level === 'ORANGE') folderColor = 'orange';
      else if (evaluation.level === 'YELLOW') folderColor = 'yellow';

      try {
        await doctorService.updatePatientFolder(patient.doctorId, patientId, {
          redFlagScore: evaluation.score as unknown as number,
          folderColor: folderColor
        })
      } catch (e) {
        console.error('Failed to update patient folder, trying upsert', e);
        await doctorService.upsertPatientFolder({
          patientId,
          doctorId: patient.doctorId,
          fullName: patient.fullName,
          age: 0,
          diseaseType,
          lastLogDate: today,
          folderColor: folderColor,
          redFlagScore: evaluation.score as unknown as number,
          alertCount: 1
        })
      }
    }
  } catch (e) {
    console.error('Non-critical secondary update failed (folders):', e);
  }

  return {
    logEntry: logData,
    alert: evaluation.level !== 'GREEN' ? { level: evaluation.level, score: evaluation.score, drivers: evaluation.drivers } : null,
    score: evaluation.score,
    drivers: evaluation.drivers
  }
}

export async function getPatientLogs(patientId: string) {
  return await prisma.dailyLog.findMany({
    where: { patientId },
    orderBy: { logDate: 'desc' }
  });
}
