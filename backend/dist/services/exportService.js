"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportDailyLogs = exportDailyLogs;
const supabaseClient_1 = require("../config/supabaseClient");
function toCsv(rows) {
    if (rows.length === 0)
        return '';
    const headers = Object.keys(rows[0]);
    const escape = (val) => {
        const s = String(val ?? '');
        if (s.includes(',') || s.includes('"') || s.includes('\n')) {
            return '"' + s.replace(/"/g, '""') + '"';
        }
        return s;
    };
    const lines = [headers.join(',')];
    for (const row of rows) {
        lines.push(headers.map(h => escape(row[h])).join(','));
    }
    return lines.join('\n');
}
async function exportDailyLogs(filters) {
    const admin = (0, supabaseClient_1.requireAdminClient)();
    let q = admin.from('daily_logs').select('*').order('created_at', { ascending: false });
    if (filters.patientId)
        q = q.eq('patient_id', filters.patientId);
    if (filters.disease)
        q = q.eq('disease_type', filters.disease);
    if (filters.startDate)
        q = q.gte('log_date', filters.startDate);
    if (filters.endDate)
        q = q.lte('log_date', filters.endDate);
    const { data, error } = await q;
    if (error)
        throw error;
    const rows = (data || []).map((log) => ({
        date: log.log_date,
        patient_id: log.patient_id,
        disease_type: log.disease_type,
        red_flag_score: log.red_flag_score,
        created_at: log.created_at
    }));
    return toCsv(rows);
}
//# sourceMappingURL=exportService.js.map