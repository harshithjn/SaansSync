"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabaseAdmin = exports.supabase = void 0;
exports.requireAdminClient = requireAdminClient;
exports.requireClient = requireClient;
require("dotenv/config");
const supabase_js_1 = require("@supabase/supabase-js");
const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
if (!supabaseUrl) {
    console.warn('SUPABASE_URL not configured');
}
exports.supabase = (supabaseUrl && supabaseAnonKey)
    ? (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
        }
    })
    : null;
exports.supabaseAdmin = (supabaseUrl && supabaseServiceKey)
    ? (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
        }
    })
    : null;
function requireAdminClient() {
    if (!exports.supabaseAdmin)
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
    return exports.supabaseAdmin;
}
function requireClient() {
    if (!exports.supabase)
        throw new Error('SUPABASE_ANON_KEY is not configured');
    return exports.supabase;
}
exports.default = {
    supabase: exports.supabase,
    supabaseAdmin: exports.supabaseAdmin,
    requireAdminClient,
    requireClient
};
//# sourceMappingURL=supabaseClient.js.map