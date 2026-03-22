"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const db_1 = __importDefault(require("./config/db"));
const jwtMiddleware_1 = require("./middleware/jwtMiddleware");
const prescriptions_1 = __importDefault(require("./routes/prescriptions"));
const auth_1 = __importDefault(require("./routes/auth"));
const admin_1 = __importDefault(require("./routes/admin"));
const patient_1 = __importDefault(require("./routes/patient"));
const doctor_1 = __importDefault(require("./routes/doctor"));
const logs_1 = __importDefault(require("./routes/logs"));
const exports_1 = __importDefault(require("./routes/exports"));
const messageRoutes_1 = __importDefault(require("./routes/messageRoutes"));
const alerts_1 = __importDefault(require("./routes/alerts"));
const PORT = process.env.PORT || 3001;
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        database: 'connected'
    });
});
app.get('/keepalive', async (req, res) => {
    try {
        await db_1.default.doctor.count();
        res.json({
            status: 'alive',
            timestamp: new Date().toISOString(),
            database: 'active'
        });
    }
    catch (error) {
        console.error('Keepalive error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Database keepalive failed',
            error: error.message
        });
    }
});
app.get('/api', (req, res) => {
    res.json({ message: 'SaansSync Backend API - Working with Database!' });
});
app.get('/api/db-status', async (req, res) => {
    try {
        await db_1.default.doctor.count();
        res.json({ status: 'connected', connected: true, timestamp: new Date().toISOString() });
    }
    catch (error) {
        res.status(500).json({ status: 'error', connected: false, message: 'Database connection failed' });
    }
});
app.use('/api/auth', auth_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/patient', patient_1.default);
app.use('/api/doctor', doctor_1.default);
app.use('/api/logs', logs_1.default);
app.use('/api/exports', exports_1.default);
app.use('/api/messages', messageRoutes_1.default);
app.use('/api/alerts', alerts_1.default);
app.use('/api/prescriptions', prescriptions_1.default);
app.use((req, res, next) => {
    if (req.path.startsWith('/api/auth') ||
        req.path === '/health' ||
        req.path === '/keepalive' ||
        req.path === '/api/db-status' ||
        req.path === '/api')
        return next();
    return (0, jwtMiddleware_1.requireAuth)(req, res, next);
});
setInterval(async () => {
    try {
        await db_1.default.doctor.count();
        console.log('✅ Database keepalive successful:', new Date().toISOString());
    }
    catch (error) {
        console.error('Auto-keepalive error:', error);
    }
}, 10 * 60 * 1000);
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err.stack);
    res.status(500).json({
        status: 'error',
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});
app.listen(PORT, () => {
    console.log(`🚀 Backend server running on port ${PORT}`);
});
exports.default = app;
//# sourceMappingURL=server.js.map