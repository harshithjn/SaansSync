"use strict";
/**
 * REFACTORED AUTH CONTROLLER
 *
 * Simplified to 3 core flows:
 * 1. Admin Login (email/password)
 * 2. Doctor Login (email/password) + Registration (OTP)
 * 3. Patient Login (OTP ONLY)
 */
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
exports.adminLogin = adminLogin;
exports.doctorLogin = doctorLogin;
exports.startDoctorRegistration = startDoctorRegistration;
exports.completeDoctorRegistration = completeDoctorRegistration;
exports.patientLoginOtp = patientLoginOtp;
exports.verifyPatientOtp = verifyPatientOtp;
exports.authMe = authMe;
exports.signOut = signOut;
const authService = __importStar(require("../services/authService.refactored"));
// ============================================================================
// ADMIN
// ============================================================================
async function adminLogin(req, res) {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email and password required' });
    }
    const result = await authService.adminLogin(email, password);
    return res.status(result.success ? 200 : 401).json(result);
}
// ============================================================================
// DOCTOR
// ============================================================================
async function doctorLogin(req, res) {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email and password required' });
    }
    const result = await authService.doctorLogin(email, password);
    return res.status(result.success ? 200 : 401).json(result);
}
async function startDoctorRegistration(req, res) {
    const { phone } = req.body;
    if (!phone) {
        return res.status(400).json({ success: false, error: 'Phone number required' });
    }
    const result = await authService.startDoctorRegistration(phone);
    return res.status(result.success ? 200 : 400).json(result);
}
async function completeDoctorRegistration(req, res) {
    const { phone, token, email, fullName, password, altPhone } = req.body;
    if (!phone || !token || !email || !fullName || !password) {
        return res.status(400).json({
            success: false,
            error: 'Phone, token, email, fullName, and password required'
        });
    }
    const result = await authService.completeDoctorRegistration({
        phone,
        token,
        email,
        fullName,
        password,
        altPhone
    });
    return res.status(result.success ? 200 : 400).json(result);
}
// ============================================================================
// PATIENT (OTP ONLY)
// ============================================================================
async function patientLoginOtp(req, res) {
    const { phone } = req.body;
    if (!phone) {
        return res.status(400).json({ success: false, error: 'Phone number required' });
    }
    const result = await authService.patientLoginWithOtp(phone);
    return res.status(result.success ? 200 : 400).json(result);
}
async function verifyPatientOtp(req, res) {
    const { phone, token } = req.body;
    if (!phone || !token) {
        return res.status(400).json({ success: false, error: 'Phone and token required' });
    }
    const result = await authService.verifyPatientOtp(phone, token);
    return res.status(result.success ? 200 : 401).json(result);
}
// ============================================================================
// SHARED
// ============================================================================
async function authMe(req, res) {
    if (!req.user?.id) {
        return res.status(401).json({ user: null });
    }
    const data = await authService.getAuthProfile({
        id: req.user.id,
        email: req.user.email
    });
    return res.json(data);
}
async function signOut(_req, res) {
    return res.json({ success: true });
}
//# sourceMappingURL=authController.refactored.js.map