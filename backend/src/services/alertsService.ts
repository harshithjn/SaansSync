import prisma from '../config/db'

export interface AlertInsert {
    patient_id: string
    doctor_id: string
    level: string
    reason_text: string
    disease_type: string
    alert_data?: Record<string, any>
}

export async function insertAlert(payload: AlertInsert, useAdmin = true) {
    const data = await prisma.alert.create({
        data: {
            patientId: payload.patient_id,
            doctorId: payload.doctor_id,
            level: payload.level,
            reasonText: payload.reason_text,
            diseaseType: payload.disease_type,
            score: payload.alert_data?.score || 0,
            alertData: payload.alert_data || {},
            acknowledged: false
        }
    });

    return data;
}

export async function getAlertsByDoctor(doctorId: string) {
    return await prisma.alert.findMany({
        where: { doctorId },
        orderBy: { createdAt: 'desc' }
    });
}

export async function getAlertsByPatient(patientId: string) {
    return await prisma.alert.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' }
    });
}

export default {
    insertAlert,
    getAlertsByDoctor,
    getAlertsByPatient
}
