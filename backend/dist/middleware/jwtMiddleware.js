"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.optionalAuth = optionalAuth;
const supabaseClient_1 = require("../config/supabaseClient");
async function requireAuth(req, res, next) {
    const header = (req.headers.authorization || req.headers.Authorization);
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Missing Authorization header' });
    }
    const token = header.split(' ')[1];
    if (!supabaseClient_1.supabase) {
        return res.status(500).json({ success: false, error: 'Supabase client not configured' });
    }
    try {
        const { data: { user }, error } = await supabaseClient_1.supabase.auth.getUser(token);
        if (error || !user) {
            console.error('Token verification failed:', error?.message);
            return res.status(401).json({ success: false, error: 'Invalid or expired token', details: error?.message });
        }
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role
        };
        return next();
    }
    catch (err) {
        console.error('Auth middleware error:', err);
        return res.status(401).json({ success: false, error: 'Authentication failed' });
    }
}
async function optionalAuth(req, _res, next) {
    const header = (req.headers.authorization || req.headers.Authorization);
    if (!header || !header.startsWith('Bearer '))
        return next();
    const token = header.split(' ')[1];
    if (!supabaseClient_1.supabase)
        return next();
    try {
        const { data: { user } } = await supabaseClient_1.supabase.auth.getUser(token);
        if (user) {
            req.user = { id: user.id, email: user.email, role: user.role };
        }
    }
    catch {
        // ignore
    }
    return next();
}
//# sourceMappingURL=jwtMiddleware.js.map