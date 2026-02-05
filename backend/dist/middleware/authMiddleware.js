"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const supabaseClient_1 = require("../config/supabaseClient");
async function authMiddleware(req, res, next) {
    // allow unauthenticated auth-related endpoints
    if (req.path.startsWith('/api/auth'))
        return next();
    const header = (req.headers.authorization || req.headers.Authorization);
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Missing Authorization header' });
    }
    const token = header.split(' ')[1];
    if (!supabaseClient_1.supabaseAdmin) {
        console.error('Auth middleware: SUPABASE_SERVICE_ROLE_KEY not configured');
        return res.status(500).json({ success: false, error: 'Auth not configured' });
    }
    try {
        // Verify token and fetch user
        // Note: supabase-js getUser expects just the token string in v2
        const { data, error } = await supabaseClient_1.supabaseAdmin.auth.getUser(token);
        if (error || !data?.user) {
            return res.status(401).json({ success: false, error: 'Invalid or expired token' });
        }
        const user = data.user;
        // Determine role by looking up user id in patient/doctor/admin tables
        let role = 'UNKNOWN';
        try {
            const { data: p } = await supabaseClient_1.supabaseAdmin.from('patients').select('id,email').eq('id', user.id).maybeSingle();
            if (p)
                role = 'PATIENT';
            else {
                const { data: d } = await supabaseClient_1.supabaseAdmin.from('doctors').select('id,email').eq('id', user.id).maybeSingle();
                if (d)
                    role = 'DOCTOR';
                else {
                    const { data: a } = await supabaseClient_1.supabaseAdmin.from('admins').select('id,email').eq('id', user.id).maybeSingle();
                    if (a)
                        role = 'ADMIN';
                }
            }
        }
        catch (dbErr) {
            console.error('Role lookup error', dbErr);
        }
        ;
        req.user = { id: user.id, email: user.email, role };
        return next();
    }
    catch (err) {
        console.error('Auth middleware error', err);
        return res.status(500).json({ success: false, error: 'Authentication error' });
    }
}
exports.default = authMiddleware;
//# sourceMappingURL=authMiddleware.js.map