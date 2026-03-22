"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertPrescription = insertPrescription;
exports.getPrescriptions = getPrescriptions;
const db_1 = __importDefault(require("../config/db"));
async function insertPrescription(payload) {
    const notes = payload.notes || JSON.stringify({
        patientName: payload.patient_name,
        doctorName: payload.doctor_name,
        personalizedAlerts: payload.personalized_alerts || []
    });
    const data = await db_1.default.prescription.create({
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
        const patient = await db_1.default.patient.findUnique({
            where: { id: payload.patient_id },
            select: { diseaseType: true, fullName: true }
        });
        await db_1.default.alert.create({
            data: {
                patientId: payload.patient_id,
                doctorId: payload.doctor_id,
                level: 'GREEN',
                score: 1,
                reasonText: `New Prescription & Instructions received from Dr. ${payload.doctor_name || 'your doctor'}.`,
                diseaseType: patient?.diseaseType || 'General',
                alertData: { prescription_id: data.id }
            }
        });
    }
    catch (alertErr) {
        console.error('Failed to trigger patient alert for prescription:', alertErr);
    }
    return data;
}
async function getPrescriptions(query) {
    const where = {};
    if (query.patientId)
        where.patientId = query.patientId;
    if (query.doctorId)
        where.doctorId = query.doctorId;
    if (query.startDate)
        where.date = { gte: new Date(query.startDate) };
    if (query.endDate)
        where.date = { ...where.date, lte: new Date(query.endDate) };
    const data = await db_1.default.prescription.findMany({
        where,
        orderBy: { date: 'desc' }
    });
    return data || [];
}
exports.default = { insertPrescription, getPrescriptions };
//# sourceMappingURL=prescriptionsService.js.map