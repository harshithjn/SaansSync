"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertAlert = insertAlert;
exports.getAlertsByDoctor = getAlertsByDoctor;
exports.getAlertsByPatient = getAlertsByPatient;
const db_1 = __importDefault(require("../config/db"));
async function insertAlert(payload, useAdmin = true) {
    const data = await db_1.default.alert.create({
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
async function getAlertsByDoctor(doctorId) {
    return await db_1.default.alert.findMany({
        where: { doctorId },
        orderBy: { createdAt: 'desc' }
    });
}
async function getAlertsByPatient(patientId) {
    return await db_1.default.alert.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' }
    });
}
exports.default = {
    insertAlert,
    getAlertsByDoctor,
    getAlertsByPatient
};
//# sourceMappingURL=alertsService.js.map