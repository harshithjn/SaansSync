import prisma from '../config/db';
import bcrypt from 'bcryptjs';

async function resolveDoctorId(doctorId?: string | null) {
  if (!doctorId) return null
  const byId = await prisma.doctor.findUnique({ where: { id: doctorId }, select: { id: true } }).catch(() => null);
  return byId?.id || doctorId
}

export async function createPatient(payload: { email: string; password?: string; fullName: string; diseaseType: string; doctorId?: string; patientData?: any }) {
  const doctorId = await resolveDoctorId(payload.doctorId || null)

  const authUserId = null;

  const patientData = payload.patientData || {}
  const comprehensive = {
    email: payload.email,
    age: patientData?.age || '',
    sex: patientData?.sex || '',
    diagnosis: patientData?.diagnosis || {},
    medications: patientData?.medications || [],
    pftRecords: patientData?.pftRecords || [],
    medicalHistory: patientData?.medicalHistory || '',
    comorbidities: patientData?.comorbidities || [],
    respiratorySupport: {
      ltot: patientData?.ltot || { enabled: false },
      bipap: patientData?.bipap || { enabled: false },
      invasiveVentilation: patientData?.invasiveVentilation || { enabled: false },
      tracheostomy: patientData?.tracheostomy || { enabled: false }
    },
    created_at: new Date().toISOString(),
    disease_type: payload.diseaseType
  }

  let hashedPassword = null;
  if (payload.password || 'patient123') {
    hashedPassword = await bcrypt.hash(payload.password || 'patient123', 10);
  }

  const patient = await prisma.patient.create({
    data: {
      email: payload.email,
      fullName: payload.fullName,
      diseaseType: payload.diseaseType,
      doctorId: doctorId,
      patientData: { ...comprehensive, ...patientData },
      authUserId: authUserId,
      password: hashedPassword,
      defaultPassword: payload.password || 'patient123'
    }
  });

  if (doctorId) {
    try {
      await prisma.doctorPatientAssignment.create({
        data: { doctorId, patientId: patient.id, status: 'active' }
      });
    } catch (e) {}
  }

  return patient;
}

export async function getPatientById(patientId: string) {
  const data = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!data) throw new Error("Patient not found");
  return mapDbToPatientData(data);
}

export async function updatePatient(patientId: string, updates: { full_name?: string; patient_data?: any }) {
  const dataToUpdate: any = {};
  if (updates.full_name !== undefined) dataToUpdate.fullName = updates.full_name;
  if (updates.patient_data !== undefined) dataToUpdate.patientData = updates.patient_data;

  await prisma.patient.update({
    where: { id: patientId },
    data: dataToUpdate
  });
  return true;
}

function mapDbToLogData(log: any) {
  if (!log) return log;
  const diseaseData = log.diseaseData || {};
  const common = diseaseData.common || {};
  const specific = diseaseData.specific || {};

  return {
    ...log,
    date: log.logDate,
    spo2: common.spo2?.atRest || common.spo2_at_rest || log.spo2_at_rest || 0,
    spo2_at_rest: common.spo2?.atRest || common.spo2_at_rest || log.spo2_at_rest || 0,
    spo2_on_exertion: common.spo2?.onExertion || common.spo2_on_exertion || log.spo2_on_exertion || 0,
    pefr: specific.peakFlowPercent || specific.pefr || specific.peak_flow || log.pefr || 0,
    peak_flow: specific.peakFlowPercent || specific.pefr || specific.peak_flow || log.pefr || 0,
    mmrc_scale: common.mMRCScale || common.mmrc_scale || log.mmrc_scale || 0,
    cough: common.symptoms?.find((s: any) => s.name?.toLowerCase() === 'cough')?.score || 0,
    breathlessness: common.symptoms?.find((s: any) => s.name?.toLowerCase() === 'breathlessness')?.score || 0,
    displayDate: log.logDate ? new Date(log.logDate).toLocaleDateString() : ''
  };
}

export async function getPatientLogs(patientId: string) {
  const data = await prisma.dailyLog.findMany({
    where: { patientId },
    orderBy: { logDate: 'desc' }
  });
  return data.map(mapDbToLogData);
}

export async function getPatientMedications(patientId: string) {
  const data = await prisma.patient.findUnique({ where: { id: patientId }, select: { patientData: true } });
  return (data?.patientData as any)?.medications || [];
}

export async function getPatientReports(patientId: string) {
  const data = await prisma.patient.findUnique({ where: { id: patientId }, select: { patientData: true } });
  const pData = data?.patientData as any;
  const pftRecords = pData?.pftRecords || [];
  const otherReports = pData?.reports || [];
  return { pftRecords, reports: otherReports };
}

export async function canLogToday(patientId: string) {
  const today = new Date(new Date().toISOString().split('T')[0]);
  const count = await prisma.dailyLog.count({
    where: { patientId, logDate: today }
  });
  return count < 1;
}

export async function getPatientInstructions(patientId: string) {
  return await prisma.doctorInstruction.findMany({
    where: { patientId },
    orderBy: { createdAt: 'desc' }
  });
}

export async function addPatientInstruction(patientId: string, doctorId: string, instruction: string) {
  return await prisma.doctorInstruction.create({
    data: { patientId, doctorId, instruction, isActive: true }
  });
}

function mapDbToPatientData(data: any) {
  if (data && data.patientData) {
    const dbData = data.patientData as any;
    return {
      fullName: data.fullName,
      emailId: data.email || dbData.email || '',
      age: dbData.age || '',
      sex: dbData.sex || dbData.gender || '',
      diagnosis: dbData.diagnosis || {
        primaryCategory: data.diseaseType || 'Unknown',
        subtype: dbData.disease_subtype || ''
      },
      medications: dbData.medications || [],
      pftRecords: dbData.pftRecords || [],
      reports: dbData.reports || [],
      medicalHistory: dbData.medicalHistory || '',
      comorbidities: dbData.comorbidities || [],
      ltot: dbData.respiratorySupport?.ltot || { enabled: false },
      bipap: dbData.respiratorySupport?.bipap || { enabled: false },
      invasiveVentilation: dbData.respiratorySupport?.invasiveVentilation || { enabled: false },
      tracheostomy: dbData.respiratorySupport?.tracheostomy || { enabled: false },
      registrationDate: data.createdAt ? new Date(data.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    }
  }
  return data
}
