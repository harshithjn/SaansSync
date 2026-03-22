"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPatient = createPatient;
exports.getPatientById = getPatientById;
exports.updatePatient = updatePatient;
exports.getPatientLogs = getPatientLogs;
exports.getPatientMedications = getPatientMedications;
exports.getPatientReports = getPatientReports;
exports.canLogToday = canLogToday;
exports.getPatientInstructions = getPatientInstructions;
exports.addPatientInstruction = addPatientInstruction;
const db_1 = __importDefault(require("../config/db"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
async function resolveDoctorId(doctorId) {
    if (!doctorId)
        return null;
    const byId = await db_1.default.doctor.findUnique({ where: { id: doctorId }, select: { id: true } }).catch(() => null);
    return byId?.id || doctorId;
}
async function createPatient(payload) {
    const doctorId = await resolveDoctorId(payload.doctorId || null);
    const authUserId = null;
    const patientData = payload.patientData || {};
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
    };
    let hashedPassword = null;
    if (payload.password || 'patient123') {
        hashedPassword = await bcryptjs_1.default.hash(payload.password || 'patient123', 10);
    }
    const patient = await db_1.default.patient.create({
        data: {
            email: payload.email,
            fullName: payload.fullName,
            diseaseType: payload.diseaseType,
            doctorId: doctorId, // Use the already resolved doctorId
            patientData: { ...comprehensive, ...patientData }, // Merge comprehensive and patientData
            authUserId: authUserId,
            password: hashedPassword,
            defaultPassword: payload.password || 'patient123'
        }
    });
    if (doctorId) {
        try {
            await db_1.default.doctorPatientAssignment.create({
                data: { doctorId, patientId: patient.id, status: 'active' }
            });
        }
        catch (e) { }
    }
    return patient;
}
async function getPatientById(patientId) {
    const data = await db_1.default.patient.findUnique({ where: { id: patientId } });
    if (!data)
        throw new Error("Patient not found");
    return mapDbToPatientData(data);
}
async function updatePatient(patientId, updates) {
    const dataToUpdate = {};
    if (updates.full_name !== undefined)
        dataToUpdate.fullName = updates.full_name;
    if (updates.patient_data !== undefined)
        dataToUpdate.patientData = updates.patient_data;
    await db_1.default.patient.update({
        where: { id: patientId },
        data: dataToUpdate
    });
    return true;
}
function mapDbToLogData(log) {
    if (!log)
        return log;
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
        cough: common.symptoms?.find((s) => s.name?.toLowerCase() === 'cough')?.score || 0,
        breathlessness: common.symptoms?.find((s) => s.name?.toLowerCase() === 'breathlessness')?.score || 0,
        displayDate: log.logDate ? new Date(log.logDate).toLocaleDateString() : ''
    };
}
async function getPatientLogs(patientId) {
    const data = await db_1.default.dailyLog.findMany({
        where: { patientId },
        orderBy: { logDate: 'desc' }
    });
    return data.map(mapDbToLogData);
}
async function getPatientMedications(patientId) {
    const data = await db_1.default.patient.findUnique({ where: { id: patientId }, select: { patientData: true } });
    return data?.patientData?.medications || [];
}
async function getPatientReports(patientId) {
    const data = await db_1.default.patient.findUnique({ where: { id: patientId }, select: { patientData: true } });
    const pData = data?.patientData;
    const pftRecords = pData?.pftRecords || [];
    const otherReports = pData?.reports || [];
    return { pftRecords, reports: otherReports };
}
async function canLogToday(patientId) {
    const today = new Date(new Date().toISOString().split('T')[0]);
    const count = await db_1.default.dailyLog.count({
        where: { patientId, logDate: today }
    });
    return count < 1;
}
async function getPatientInstructions(patientId) {
    return await db_1.default.doctorInstruction.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' }
    });
}
async function addPatientInstruction(patientId, doctorId, instruction) {
    return await db_1.default.doctorInstruction.create({
        data: { patientId, doctorId, instruction, isActive: true }
    });
}
function mapDbToPatientData(data) {
    if (data && data.patientData) {
        const dbData = data.patientData;
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
        };
    }
    return data;
}
//# sourceMappingURL=patientService.js.map