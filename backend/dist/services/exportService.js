"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportDailyLogs = exportDailyLogs;
const db_1 = __importDefault(require("../config/db"));
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
    const where = {};
    if (filters.patientId)
        where.patientId = filters.patientId;
    if (filters.disease)
        where.diseaseType = filters.disease;
    if (filters.startDate)
        where.logDate = { gte: new Date(filters.startDate) };
    if (filters.endDate)
        where.logDate = { ...where.logDate, lte: new Date(filters.endDate) };
    const data = await db_1.default.dailyLog.findMany({
        where,
        orderBy: { createdAt: 'desc' }
    });
    const rows = data.map((log) => ({
        date: log.logDate,
        patient_id: log.patientId,
        disease_type: log.diseaseType,
        red_flag_score: log.redFlagScore,
        created_at: log.createdAt
    }));
    return toCsv(rows);
}
//# sourceMappingURL=exportService.js.map