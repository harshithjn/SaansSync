"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllDoctors = getAllDoctors;
exports.approveDoctorAccount = approveDoctorAccount;
exports.rejectDoctorAccount = rejectDoctorAccount;
exports.fixApprovedDoctors = fixApprovedDoctors;
exports.getRecentPatients = getRecentPatients;
const db_1 = __importDefault(require("../config/db"));
const authService_1 = require("../services/authService");
function ensureAdmin(req, res) {
    if (!(0, authService_1.isAdminEmail)(req.user?.email || null)) {
        res.status(403).json({ success: false, error: 'Admin role required' });
        return false;
    }
    return true;
}
async function getAllDoctors(req, res) {
    if (!ensureAdmin(req, res))
        return;
    try {
        const doctors = await db_1.default.doctor.findMany({ orderBy: { createdAt: 'desc' } });
        return res.json(doctors);
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
}
async function approveDoctorAccount(req, res) {
    if (!ensureAdmin(req, res))
        return;
    const doctorId = req.params.doctorId;
    try {
        const doctor = await db_1.default.doctor.findUnique({ where: { id: doctorId } });
        if (!doctor) {
            return res.status(404).json({ success: false, error: 'Doctor not found' });
        }
        if (doctor.approvalStatus === 'approved' && doctor.authUserId) {
            return res.status(400).json({ success: false, error: 'Doctor is already approved' });
        }
        await db_1.default.doctor.update({
            where: { id: doctorId },
            data: {
                approvalStatus: 'approved'
            }
        });
        return res.json({ success: true });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
}
async function rejectDoctorAccount(req, res) {
    if (!ensureAdmin(req, res))
        return;
    const doctorId = req.params.doctorId;
    try {
        await db_1.default.doctor.update({
            where: { id: doctorId },
            data: { approvalStatus: 'rejected' }
        });
        return res.json({ success: true });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
}
async function fixApprovedDoctors(_req, res) {
    return res.json({ success: true, message: 'Clerk removed, no fixing needed.' });
}
async function getRecentPatients(req, res) {
    if (!ensureAdmin(req, res))
        return;
    try {
        const patients = await db_1.default.patient.findMany({
            select: { id: true, fullName: true, email: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        return res.json(patients);
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
}
//# sourceMappingURL=adminController.js.map