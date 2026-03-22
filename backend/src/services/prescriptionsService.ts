import prisma from '../config/db'

export async function insertPrescription(payload: any) {
  const notes = payload.notes || JSON.stringify({
    patientName: payload.patient_name,
    doctorName: payload.doctor_name,
    personalizedAlerts: payload.personalized_alerts || []
  })

  const data = await prisma.prescription.create({
    data: {
        patientId: payload.patient_id,
        doctorId: payload.doctor_id,
        date: payload.prescription_date ? new Date(payload.prescription_date) : new Date(),
        medications: payload.medications || [],
        instructions: payload.instructions || null,
        // diagnosis is not in the Prisma schema because it was not in saanssync_final_schema.sql explicitly for prescriptions
    }
  });

  try {
    const patient = await prisma.patient.findUnique({
        where: { id: payload.patient_id },
        select: { diseaseType: true, fullName: true }
    });

    await prisma.alert.create({
      data: {
        patientId: payload.patient_id,
        doctorId: payload.doctor_id,
        level: 'GREEN',
        score: 1,
        reasonText: `New Prescription & Instructions received from Dr. ${payload.doctor_name || 'your doctor'}.`,
        diseaseType: patient?.diseaseType || 'General',
        alertData: { prescription_id: data.id }
      }
    })
  } catch (alertErr) {
    console.error('Failed to trigger patient alert for prescription:', alertErr)
  }

  return data
}

export async function getPrescriptions(query: { patientId?: string; doctorId?: string; startDate?: string; endDate?: string }) {
  const where: any = {};
  if (query.patientId) where.patientId = query.patientId;
  if (query.doctorId) where.doctorId = query.doctorId;
  if (query.startDate) where.date = { gte: new Date(query.startDate) };
  if (query.endDate) where.date = { ...where.date, lte: new Date(query.endDate) };

  const data = await prisma.prescription.findMany({
      where,
      orderBy: { date: 'desc' }
  });

  return data || []
}

export default { insertPrescription, getPrescriptions }
