import prisma from '../config/db'

export async function createDoctorProfile(userId: string, payload: { fullName: string; email?: string }) {
  return await prisma.doctor.create({
    data: {
      authUserId: userId,
      fullName: payload.fullName,
      email: payload.email || '',
      approvalStatus: 'pending'
    }
  });
}

export async function getDoctorProfile(doctorId: string) {
  const doctorPK = await resolveDoctorId(doctorId);
  if (!doctorPK) throw new Error("Doctor not found");
  return await prisma.doctor.findUnique({ where: { id: doctorPK } });
}

async function resolveDoctorId(doctorId: string) {
  let doc = await prisma.doctor.findUnique({ where: { id: doctorId } }).catch(() => null);
  if (doc) return doc.id;
  doc = await prisma.doctor.findUnique({ where: { authUserId: doctorId } }).catch(() => null);
  if (doc) return doc.id;
  return doctorId;
}

export async function getDoctorPatients(doctorId: string) {
  const doctorPK = await resolveDoctorId(doctorId);
  if (!doctorPK) return [];

  const patients = await prisma.patient.findMany({
    where: { OR: [{ doctorId: doctorPK }, { doctorId }] },
    select: { id: true, fullName: true, email: true, patientData: true, createdAt: true, doctorId: true, diseaseType: true }
  });

  return patients.map(p => {
    const pData = p.patientData as any;
    return {
      ...p,
      disease_type: pData?.diagnosis?.primaryCategory || pData?.disease_type || p.diseaseType || 'Unknown'
    };
  });
}

export async function getDoctorLogs(doctorId: string) {
  const doctorPK = await resolveDoctorId(doctorId);
  if (!doctorPK) return [];

  const patients = await prisma.patient.findMany({
    where: { OR: [{ doctorId: doctorPK }, { doctorId }] },
    select: { id: true, fullName: true, patientData: true }
  });

  if (patients.length === 0) return [];
  const patientIds = patients.map(p => p.id);

  const logs = await prisma.dailyLog.findMany({
    where: { patientId: { in: patientIds } },
    orderBy: { createdAt: 'desc' }
  });

  return logs.map(log => {
    const patient = patients.find(p => p.id === log.patientId);
    const pData = patient?.patientData as any;
    return {
      ...log,
      patient_name: patient?.fullName || 'Unknown',
      patient_disease: pData?.diagnosis?.primaryCategory || pData?.disease_type || 'Unknown'
    };
  });
}

export async function getDoctorAlerts(doctorId: string) {
  const doctorPK = await resolveDoctorId(doctorId);
  if (!doctorPK) return [];

  const alerts = await prisma.alert.findMany({
    where: { OR: [{ doctorId: doctorPK }, { doctorId }] },
    orderBy: { createdAt: 'desc' }
  });

  return alerts.map(alert => {
    let type = 'pending-review';
    let red_flag_score = 1;

    if (alert.level === 'RED') {
      type = 'critical';
      red_flag_score = 10;
    } else if (alert.level === 'ORANGE') {
      type = 'high-risk';
      red_flag_score = 8;
    } else if (alert.level === 'YELLOW') {
      type = 'high-risk';
      red_flag_score = 4;
    }

    return { ...alert, type, red_flag_score };
  });
}

export async function assignPatientToDoctor(doctorId: string, patientId: string, diseaseType?: string) {
  const doctorPK = await resolveDoctorId(doctorId);
  if (!doctorPK) return false;

  await prisma.doctorPatientMapping.upsert({
    where: { doctorId_patientId: { doctorId: doctorPK, patientId } },
    update: { diseaseType: diseaseType || null },
    create: { doctorId: doctorPK, patientId, diseaseType: diseaseType || null }
  });

  await prisma.doctorPatientAssignment.upsert({
    where: { doctorId_patientId: { doctorId: doctorPK, patientId } },
    update: { status: 'active' },
    create: { doctorId: doctorPK, patientId, status: 'active' }
  });

  return true;
}

export async function upsertPatientFolder(payload: {
  patientId: string
  doctorId: string
  fullName: string
  age: number
  diseaseType: string
  lastLogDate: string
  folderColor: string
  redFlagScore: number
  alertCount: number
}) {
  const doctorPK = await resolveDoctorId(payload.doctorId);
  if (!doctorPK) return null;

  try {
    const folder = await prisma.patientFolder.upsert({
      where: { doctorId_patientId: { doctorId: doctorPK, patientId: payload.patientId } },
      update: {
        fullName: payload.fullName,
        age: payload.age,
        diseaseType: payload.diseaseType,
        lastLogDate: payload.lastLogDate ? new Date(payload.lastLogDate) : null,
        folderColor: payload.folderColor,
        redFlagScore: payload.redFlagScore,
        alertCount: payload.alertCount,
        updatedAt: new Date()
      },
      create: {
        patientId: payload.patientId,
        doctorId: doctorPK,
        fullName: payload.fullName,
        age: payload.age,
        diseaseType: payload.diseaseType,
        lastLogDate: payload.lastLogDate ? new Date(payload.lastLogDate) : null,
        folderColor: payload.folderColor,
        redFlagScore: payload.redFlagScore,
        alertCount: payload.alertCount
      }
    });

    try {
      await assignPatientToDoctor(doctorPK, payload.patientId, payload.diseaseType);
    } catch (e) {
      console.warn('Skipping patient assignment (non-critical):', e);
    }

    return folder;
  } catch (e) {
    console.error('Upsert folder failed:', e);
    return null;
  }
}

export async function getPatientFolders(doctorId: string) {
  const doctorPK = await resolveDoctorId(doctorId);
  if (!doctorPK) return [];

  const folders = await prisma.patientFolder.findMany({
    where: { doctorId: doctorPK }
  });

  return folders;
}

export async function updatePatientFolder(doctorId: string, patientId: string, updates: { redFlagScore?: number; alertCount?: number; folderColor?: string }) {
  const doctorPK = await resolveDoctorId(doctorId);
  if (!doctorPK) return false;

  await prisma.patientFolder.update({
    where: { doctorId_patientId: { doctorId: doctorPK, patientId } },
    data: {
      redFlagScore: updates.redFlagScore,
      alertCount: updates.alertCount,
      folderColor: updates.folderColor,
      updatedAt: new Date()
    }
  });
  return true;
}

export async function deletePatientFolder(doctorId: string, patientId: string) {
  const doctorPK = await resolveDoctorId(doctorId);
  if (!doctorPK) return false;

  await prisma.patientFolder.delete({
    where: { doctorId_patientId: { doctorId: doctorPK, patientId } }
  });
  return true;
}
