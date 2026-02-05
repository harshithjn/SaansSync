"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Backend Server Entry Point - Complete with Database Integration
require("dotenv/config");
const app_1 = __importDefault(require("./app"));
const supabaseClient_1 = require("./config/supabaseClient");
const prescriptions_1 = __importDefault(require("./routes/prescriptions"));
const personalizedAlerts_1 = __importDefault(require("./routes/personalizedAlerts"));
const auth_1 = __importDefault(require("./routes/auth"));
const admin_1 = __importDefault(require("./routes/admin"));
const patient_1 = __importDefault(require("./routes/patient"));
const doctor_1 = __importDefault(require("./routes/doctor"));
const logs_1 = __importDefault(require("./routes/logs"));
const exports_1 = __importDefault(require("./routes/exports"));
const PORT = process.env.PORT || 3001;
// Health check endpoint
app_1.default.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        database: 'connected'
    });
});
// Database keepalive endpoint
app_1.default.get('/keepalive', async (req, res) => {
    if (!supabaseClient_1.supabase)
        return res.status(503).json({ status: 'error', message: 'Supabase not configured' });
    try {
        // Test database connectivity with a simple query to a public table
        const { data, error } = await supabaseClient_1.supabase
            .from('doctors')
            .select('count')
            .limit(1);
        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned, which is fine
            console.error('Keepalive error:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Database connection failed',
                error: error.message
            });
        }
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
            message: 'Database keepalive failed'
        });
    }
});
// Basic API endpoint
app_1.default.get('/api', (req, res) => {
    res.json({ message: 'SaansSync Backend API - Working with Database!' });
});
// Database status endpoint
app_1.default.get('/api/db-status', async (req, res) => {
    if (!supabaseClient_1.supabase)
        return res.status(503).json({ status: 'error', connected: false, message: 'Supabase not configured' });
    try {
        // Test database connectivity with a simple query to a public table
        const { data, error } = await supabaseClient_1.supabase
            .from('doctors')
            .select('count')
            .limit(1);
        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned, which is fine
            return res.status(500).json({ status: 'error', connected: false, error: error.message });
        }
        res.json({ status: 'connected', connected: true, timestamp: new Date().toISOString() });
    }
    catch (error) {
        res.status(500).json({ status: 'error', connected: false, message: 'Database connection failed' });
    }
});
// Auth routes
app_1.default.use('/api/auth', auth_1.default);
// Admin routes
app_1.default.use('/api/admin', admin_1.default);
// Patient routes
app_1.default.use('/api/patient', patient_1.default);
// Doctor routes
app_1.default.use('/api/doctor', doctor_1.default);
// Logs routes
app_1.default.use('/api/logs', logs_1.default);
// Export routes
app_1.default.use('/api/exports', exports_1.default);
// Alerts routes moved to modular router (see src/routes/alerts.ts)
const alerts_1 = __importDefault(require("./routes/alerts"));
app_1.default.use('/api/alerts', alerts_1.default);
// Prescriptions routes (modular)
app_1.default.use('/api/prescriptions', prescriptions_1.default);
// Personalized alerts routes (modular)
app_1.default.use('/api/personalized-alerts', personalizedAlerts_1.default);
// Automatic keepalive every 10 minutes
setInterval(async () => {
    if (!supabaseClient_1.supabase)
        return;
    try {
        // Test database connectivity with a simple query to a public table
        const { data, error } = await supabaseClient_1.supabase
            .from('doctors')
            .select('count')
            .limit(1);
        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned, which is fine
            console.error('Auto-keepalive failed:', error);
        }
        else {
            console.log('✅ Database keepalive successful:', new Date().toISOString());
        }
    }
    catch (error) {
        console.error('Auto-keepalive error:', error);
    }
}, 10 * 60 * 1000); // 10 minutes
// Global Error Handler
app_1.default.use((err, req, res, next) => {
    console.error('Unhandled Error:', err.stack);
    res.status(500).json({
        status: 'error',
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});
// Start server
app_1.default.listen(PORT, () => {
    console.log(`🚀 Backend server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`💓 Keepalive: http://localhost:${PORT}/keepalive`);
    console.log(`🗄️  Database status: http://localhost:${PORT}/api/db-status`);
    console.log(`⏰ Auto-keepalive every 10 minutes`);
});
exports.default = app_1.default;
//# sourceMappingURL=server.js.map