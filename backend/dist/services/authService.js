"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdminEmail = isAdminEmail;
exports.createToken = createToken;
exports.startDoctorRegistration = startDoctorRegistration;
exports.completeDoctorRegistration = completeDoctorRegistration;
exports.doctorLoginWithPassword = doctorLoginWithPassword;
exports.doctorLoginWithOtp = doctorLoginWithOtp;
exports.verifyDoctorOtp = verifyDoctorOtp;
exports.setupDoctorPassword = setupDoctorPassword;
exports.startPasswordReset = startPasswordReset;
exports.patientLoginWithOtp = patientLoginWithOtp;
exports.verifyPatientOtp = verifyPatientOtp;
exports.patientLoginWithPassword = patientLoginWithPassword;
exports.adminLogin = adminLogin;
exports.doctorSignup = doctorSignup;
exports.patientSignup = patientSignup;
exports.testEmail = testEmail;
exports.exchangeCodeForSession = exchangeCodeForSession;
exports.getAuthProfile = getAuthProfile;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = __importDefault(require("../config/db"));
const JWT_SECRET = process.env.JWT_SECRET || 'saanssync_local_secret';
const SALT_ROUNDS = 10;
const ADMIN_EMAILS = [
    'harshithj1121@gmail.com',
    'admin@healthplatform.com',
    'admin@saanssync.com'
];
function isAdminEmail(email) {
    if (!email)
        return false;
    return ADMIN_EMAILS.includes(email);
}
function createToken(userId, email, role) {
    return jsonwebtoken_1.default.sign({ id: userId, email, role }, JWT_SECRET, { expiresIn: '7d' });
}
// Clerk handles all auth flows, these function stubs return errors to force usage of Clerk.
async function startDoctorRegistration(..._args) { return { success: false, error: 'Use simplified signup' }; }
async function completeDoctorRegistration(..._args) { return { success: false, error: 'Use simplified signup' }; }
async function doctorLoginWithPassword(email, password) {
    const doctor = await db_1.default.doctor.findUnique({ where: { email } });
    if (!doctor)
        return { success: false, error: 'Doctor not found' };
    if (doctor.password && password) {
        const valid = await bcryptjs_1.default.compare(password, doctor.password);
        if (!valid)
            return { success: false, error: 'Invalid password' };
    }
    else if (doctor.password && !password) {
        return { success: false, error: 'Password required' };
    }
    const token = createToken(doctor.id, doctor.email, 'doctor');
    return { success: true, token, doctorProfile: doctor };
}
async function doctorLoginWithOtp(..._args) { return { success: false, error: 'Login handled by Clerk' }; }
async function verifyDoctorOtp(..._args) { return { success: false, error: 'Login handled by Clerk' }; }
async function setupDoctorPassword(..._args) { return { success: false, error: 'Password setup handled by Clerk' }; }
async function startPasswordReset(..._args) { return { success: false, error: 'Not implemented' }; }
async function patientLoginWithOtp(..._args) { return { success: false, error: 'Login handled by Clerk' }; }
async function verifyPatientOtp(..._args) { return { success: false, error: 'Login handled by Clerk' }; }
async function patientLoginWithPassword(email, password) {
    const patient = await db_1.default.patient.findUnique({ where: { email } });
    if (!patient)
        return { success: false, error: 'Patient not found' };
    if (patient.password && password) {
        const valid = await bcryptjs_1.default.compare(password, patient.password);
        if (!valid)
            return { success: false, error: 'Invalid password' };
    }
    else if (patient.password && !password) {
        return { success: false, error: 'Password required' };
    }
    const token = createToken(patient.id, patient.email, 'patient');
    return { success: true, token, patientProfile: patient };
}
async function adminLogin(email, password) {
    if (!isAdminEmail(email))
        return { success: false, error: 'Not an admin email' };
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'saanssync_admin';
    if (password !== ADMIN_PASSWORD) {
        return { success: false, error: 'Invalid admin password' };
    }
    const token = createToken('admin', email, 'admin');
    return { success: true, token };
}
async function doctorSignup(email, fullName, password) {
    const existing = await db_1.default.doctor.findUnique({ where: { email } });
    if (existing)
        return { success: false, error: 'Email already exists' };
    let hashedPassword = null;
    if (password) {
        hashedPassword = await bcryptjs_1.default.hash(password, SALT_ROUNDS);
    }
    const doctor = await db_1.default.doctor.create({
        data: {
            email,
            fullName,
            approvalStatus: 'approved',
            password: hashedPassword
        }
    });
    const token = createToken(doctor.id, doctor.email, 'doctor');
    return { success: true, token, doctorProfile: doctor };
}
async function patientSignup(email, fullName, password) {
    const existing = await db_1.default.patient.findUnique({ where: { email } });
    if (existing)
        return { success: false, error: 'Email already exists' };
    let hashedPassword = null;
    if (password) {
        hashedPassword = await bcryptjs_1.default.hash(password, SALT_ROUNDS);
    }
    const patient = await db_1.default.patient.create({
        data: {
            email,
            fullName,
            password: hashedPassword,
            registrationDate: new Date(),
            diagnosis: {
                primaryCategory: 'ILD',
                isAsthmatic: false
            },
            comorbidities: [],
            medications: []
        }
    });
    const token = createToken(patient.id, patient.email, 'patient');
    return { success: true, token, patientProfile: patient };
}
async function testEmail(..._args) { return { success: false, error: 'Not implemented' }; }
async function exchangeCodeForSession(..._args) { return { success: false, error: 'Verification handled by Clerk' }; }
async function getAuthProfile(user) {
    if (user.role === 'admin' || isAdminEmail(user.email)) {
        return {
            user,
            role: 'admin',
            profile: { email: user.email },
            approved: true
        };
    }
    const doctorProfile = await db_1.default.doctor.findUnique({
        where: { id: user.id }
    });
    if (doctorProfile) {
        return {
            user,
            role: 'doctor',
            profile: doctorProfile,
            approved: doctorProfile.approvalStatus === 'approved'
        };
    }
    const patientProfile = await db_1.default.patient.findUnique({
        where: { id: user.id }
    });
    if (patientProfile) {
        return {
            user,
            role: 'patient',
            profile: patientProfile,
            approved: true
        };
    }
    return { user, role: null, profile: null };
}
//# sourceMappingURL=authService.js.map