"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.optionalAuth = optionalAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../config/db"));
const JWT_SECRET = process.env.JWT_SECRET || 'saanssync_local_secret';
async function requireAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
        if (!token) {
            return res.status(401).json({ success: false, error: 'Authorization token missing' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        if (!decoded || !decoded.id) {
            return res.status(401).json({ success: false, error: 'Invalid or expired token' });
        }
        let role = decoded.role || 'UNKNOWN';
        let email = decoded.email || '';
        // Map DB roles if needed
        const doctor = await db_1.default.doctor.findUnique({ where: { id: decoded.id } });
        if (doctor) {
            role = 'DOCTOR';
            email = doctor.email;
        }
        else {
            const patient = await db_1.default.patient.findUnique({ where: { id: decoded.id } });
            if (patient) {
                role = 'PATIENT';
                email = patient.email;
            }
        }
        req.user = { id: decoded.id, email, role };
        return next();
    }
    catch (err) {
        console.error('Auth middleware error:', err);
        return res.status(401).json({ success: false, error: 'Authentication failed' });
    }
}
async function optionalAuth(req, _res, next) {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
        if (token) {
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            if (decoded && decoded.id) {
                req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
            }
        }
    }
    catch {
        // ignore
    }
    return next();
}
//# sourceMappingURL=jwtMiddleware.js.map