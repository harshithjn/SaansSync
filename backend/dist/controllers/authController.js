"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.startDoctorRegistration = startDoctorRegistration;
exports.completeDoctorRegistration = completeDoctorRegistration;
exports.doctorLogin = doctorLogin;
exports.doctorLoginOtp = doctorLoginOtp;
exports.verifyDoctorOtp = verifyDoctorOtp;
exports.setupDoctorPassword = setupDoctorPassword;
exports.startPasswordReset = startPasswordReset;
exports.completePasswordReset = completePasswordReset;
exports.patientLoginOtp = patientLoginOtp;
exports.verifyPatientOtp = verifyPatientOtp;
exports.patientLogin = patientLogin;
exports.adminLogin = adminLogin;
exports.doctorSignup = doctorSignup;
exports.patientSignup = patientSignup;
exports.testEmail = testEmail;
exports.exchangeCallback = exchangeCallback;
exports.authMe = authMe;
exports.signOut = signOut;
const authService = __importStar(require("../services/authService"));
async function startDoctorRegistration(req, res) {
    const { email } = req.body;
    if (!email)
        return res.status(400).json({ success: false, error: 'email required' });
    const result = await authService.startDoctorRegistration(email);
    return res.status(result.success ? 200 : 400).json(result);
}
async function completeDoctorRegistration(req, res) {
    const { token, email, fullName, password } = req.body;
    if (!token || !email || !fullName || !password) {
        return res.status(400).json({ success: false, error: 'token, email, fullName, password required' });
    }
    const result = await authService.completeDoctorRegistration({ token, email, fullName, password });
    return res.status(result.success ? 200 : 400).json(result);
}
async function doctorLogin(req, res) {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ success: false, error: 'email and password required' });
    const result = await authService.doctorLoginWithPassword(email, password);
    return res.status(result.success ? 200 : 401).json(result);
}
async function doctorLoginOtp(req, res) {
    const { email } = req.body;
    if (!email)
        return res.status(400).json({ success: false, error: 'email required' });
    const result = await authService.doctorLoginWithOtp(email);
    return res.status(result.success ? 200 : 400).json(result);
}
async function verifyDoctorOtp(req, res) {
    const { email, token } = req.body;
    if (!email || !token)
        return res.status(400).json({ success: false, error: 'email and token required' });
    const result = await authService.verifyDoctorOtp(email, token);
    return res.status(result.success ? 200 : 401).json(result);
}
async function setupDoctorPassword(req, res) {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword)
        return res.status(400).json({ success: false, error: 'email, token, newPassword required' });
    const result = await authService.setupDoctorPassword(email, token, newPassword);
    return res.status(result.success ? 200 : 400).json(result);
}
async function startPasswordReset(req, res) {
    const { email } = req.body;
    if (!email)
        return res.status(400).json({ success: false, error: 'email required' });
    const result = await authService.startPasswordReset(email);
    return res.status(result.success ? 200 : 400).json(result);
}
async function completePasswordReset(req, res) {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword)
        return res.status(400).json({ success: false, error: 'email, token, newPassword required' });
    const result = await authService.setupDoctorPassword(email, token, newPassword);
    return res.status(result.success ? 200 : 400).json(result);
}
async function patientLoginOtp(req, res) {
    const { email } = req.body;
    if (!email)
        return res.status(400).json({ success: false, error: 'email required' });
    const result = await authService.patientLoginWithOtp(email);
    return res.status(result.success ? 200 : 400).json(result);
}
async function verifyPatientOtp(req, res) {
    const { email, token } = req.body;
    if (!email || !token)
        return res.status(400).json({ success: false, error: 'email and token required' });
    const result = await authService.verifyPatientOtp(email, token);
    return res.status(result.success ? 200 : 401).json(result);
}
async function patientLogin(req, res) {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ success: false, error: 'email and password required' });
    const result = await authService.patientLoginWithPassword(email, password);
    return res.status(result.success ? 200 : 401).json(result);
}
async function adminLogin(req, res) {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ success: false, error: 'email and password required' });
    const result = await authService.adminLogin(email, password);
    return res.status(result.success ? 200 : 401).json(result);
}
async function doctorSignup(req, res) {
    const { email, fullName, password } = req.body;
    if (!email || !fullName)
        return res.status(400).json({ success: false, error: 'email and fullName required' });
    const result = await authService.doctorSignup(email, fullName, password);
    return res.status(result.success ? 200 : 400).json(result);
}
async function patientSignup(req, res) {
    const { email, fullName, password } = req.body;
    if (!email || !fullName)
        return res.status(400).json({ success: false, error: 'email and fullName required' });
    const result = await authService.patientSignup(email, fullName, password);
    return res.status(result.success ? 200 : 400).json(result);
}
async function testEmail(req, res) {
    const { email } = req.body;
    if (!email)
        return res.status(400).json({ success: false, error: 'email required' });
    const result = await authService.testEmail(email);
    return res.status(result.success ? 200 : 400).json(result);
}
async function exchangeCallback(req, res) {
    const { code } = req.body;
    if (!code)
        return res.status(400).json({ success: false, error: 'code required' });
    const result = await authService.exchangeCodeForSession(code);
    return res.status(result.success ? 200 : 400).json(result);
}
async function authMe(req, res) {
    if (!req.user?.id)
        return res.status(401).json({ user: null });
    const data = await authService.getAuthProfile({
        id: req.user.id,
        email: req.user.email,
        role: req.user.role
    });
    return res.json(data);
}
async function signOut(_req, res) {
    return res.json({ success: true });
}
//# sourceMappingURL=authController.js.map