"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDoctorProfile = createDoctorProfile;
exports.getDoctorProfile = getDoctorProfile;
exports.getDoctorPatients = getDoctorPatients;
exports.getDoctorLogs = getDoctorLogs;
exports.getDoctorAlerts = getDoctorAlerts;
exports.assignPatientToDoctor = assignPatientToDoctor;
exports.upsertPatientFolder = upsertPatientFolder;
exports.getPatientFolders = getPatientFolders;
exports.updatePatientFolder = updatePatientFolder;
exports.deletePatientFolder = deletePatientFolder;
const db_1 = __importDefault(require("../config/db"));
async function createDoctorProfile(userId, payload) {
    return await db_1.default.doctor.create({
        data: {
            authUserId: userId,
            fullName: payload.fullName,
            email: payload.email || '',
            approvalStatus: 'pending'
        }
    });
}
async function getDoctorProfile(doctorId) {
    const doctorPK = await resolveDoctorId(doctorId);
    if (!doctorPK)
        throw new Error("Doctor not found");
    return await db_1.default.doctor.findUnique({ where: { id: doctorPK } });
}
async function resolveDoctorId(doctorId) {
    let doc = await db_1.default.doctor.findUnique({ where: { id: doctorId } }).catch(() => null);
    if (doc)
        return doc.id;
    doc = await db_1.default.doctor.findUnique({ where: { authUserId: doctorId } }).catch(() => null);
    if (doc)
        return doc.id;
    return doctorId;
}
async function getDoctorPatients(doctorId) {
    const doctorPK = await resolveDoctorId(doctorId);
    if (!doctorPK)
        return [];
    const patients = await db_1.default.patient.findMany({
        where: { OR: [{ doctorId: doctorPK }, { doctorId }] },
        select: { id: true, fullName: true, email: true, patientData: true, createdAt: true, doctorId: true, diseaseType: true }
    });
    return patients.map(p => {
        const pData = p.patientData;
        return {
            ...p,
            disease_type: pData?.diagnosis?.primaryCategory || pData?.disease_type || p.diseaseType || 'Unknown'
        };
    });
}
async function getDoctorLogs(doctorId) {
    const doctorPK = await resolveDoctorId(doctorId);
    if (!doctorPK)
        return [];
    const patients = await db_1.default.patient.findMany({
        where: { OR: [{ doctorId: doctorPK }, { doctorId }] },
        select: { id: true, fullName: true, patientData: true }
    });
    if (patients.length === 0)
        return [];
    const patientIds = patients.map(p => p.id);
    const logs = await db_1.default.dailyLog.findMany({
        where: { patientId: { in: patientIds } },
        orderBy: { createdAt: 'desc' }
    });
    return logs.map(log => {
        const patient = patients.find(p => p.id === log.patientId);
        const pData = patient?.patientData;
        return {
            ...log,
            patient_name: patient?.fullName || 'Unknown',
            patient_disease: pData?.diagnosis?.primaryCategory || pData?.disease_type || 'Unknown'
        };
    });
}
async function getDoctorAlerts(doctorId) {
    const doctorPK = await resolveDoctorId(doctorId);
    if (!doctorPK)
        return [];
    const alerts = await db_1.default.alert.findMany({
        where: { OR: [{ doctorId: doctorPK }, { doctorId }] },
        orderBy: { createdAt: 'desc' }
    });
    return alerts.map(alert => {
        let type = 'pending-review';
        let red_flag_score = 1;
        if (alert.level === 'RED') {
            type = 'critical';
            red_flag_score = 10;
        }
        else if (alert.level === 'ORANGE') {
            type = 'high-risk';
            red_flag_score = 8;
        }
        else if (alert.level === 'YELLOW') {
            type = 'high-risk';
            red_flag_score = 4;
        }
        return { ...alert, type, red_flag_score };
    });
}
async function assignPatientToDoctor(doctorId, patientId, diseaseType) {
    const doctorPK = await resolveDoctorId(doctorId);
    if (!doctorPK)
        return false;
    await db_1.default.doctorPatientMapping.upsert({
        where: { doctorId_patientId: { doctorId: doctorPK, patientId } },
        update: { diseaseType: diseaseType || null },
        create: { doctorId: doctorPK, patientId, diseaseType: diseaseType || null }
    });
    await db_1.default.doctorPatientAssignment.upsert({
        where: { doctorId_patientId: { doctorId: doctorPK, patientId } },
        update: { status: 'active' },
        create: { doctorId: doctorPK, patientId, status: 'active' }
    });
    return true;
}
async function upsertPatientFolder(payload) {
    const doctorPK = await resolveDoctorId(payload.doctorId);
    if (!doctorPK)
        return null;
    try {
        const folder = await db_1.default.patientFolder.upsert({
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
        }
        catch (e) {
            console.warn('Skipping patient assignment (non-critical):', e);
        }
        return folder;
    }
    catch (e) {
        console.error('Upsert folder failed:', e);
        return null;
    }
}
async function getPatientFolders(doctorId) {
    const doctorPK = await resolveDoctorId(doctorId);
    if (!doctorPK)
        return [];
    const folders = await db_1.default.patientFolder.findMany({
        where: { doctorId: doctorPK }
    });
    return folders;
}
async function updatePatientFolder(doctorId, patientId, updates) {
    const doctorPK = await resolveDoctorId(doctorId);
    if (!doctorPK)
        return false;
    await db_1.default.patientFolder.update({
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
async function deletePatientFolder(doctorId, patientId) {
    const doctorPK = await resolveDoctorId(doctorId);
    if (!doctorPK)
        return false;
    await db_1.default.patientFolder.delete({
        where: { doctorId_patientId: { doctorId: doctorPK, patientId } }
    });
    return true;
}
//# sourceMappingURL=doctorService.js.map