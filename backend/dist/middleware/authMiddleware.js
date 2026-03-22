"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const express_1 = require("@clerk/express");
const db_1 = __importDefault(require("../config/db"));
async function authMiddleware(req, res, next) {
    if (req.path.startsWith('/api/auth'))
        return next();
    try {
        const auth = (0, express_1.getAuth)(req);
        if (!auth.userId) {
            return res.status(401).json({ success: false, error: 'Missing Authorization' });
        }
        let role = 'UNKNOWN';
        let email = '';
        const doctor = await db_1.default.doctor.findUnique({ where: { authUserId: auth.userId } });
        if (doctor) {
            role = 'DOCTOR';
            email = doctor.email;
        }
        else {
            const patient = await db_1.default.patient.findUnique({ where: { authUserId: auth.userId } });
            if (patient) {
                role = 'PATIENT';
                email = patient.email;
            }
        }
        ;
        req.user = { id: auth.userId, email, role };
        return next();
    }
    catch (err) {
        console.error('Auth middleware error', err);
        return res.status(500).json({ success: false, error: 'Authentication error' });
    }
}
exports.default = authMiddleware;
//# sourceMappingURL=authMiddleware.js.map