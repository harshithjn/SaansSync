"use strict";
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
exports.createDailyLog = createDailyLog;
exports.getPatientLogs = getPatientLogs;
const supabaseClient_1 = require("../config/supabaseClient");
const alertService = __importStar(require("./alertService"));
const doctorService = __importStar(require("./doctorService"));
async function createDailyLog(payload) {
    const admin = (0, supabaseClient_1.requireAdminClient)();
    const { patientId, diseaseType, commonData, diseaseSpecificData } = payload;
    // 1. Check if already logged today
    //   const canLog = await canLogToday(patientId) 
    //   if (!canLog) {
    //     throw new Error('Daily logging limit reached (1 log per day)')
    //   }
    // 1. Prepare submission object
    const submission = {
        patientId,
        diseaseType,
        common: commonData,
        specific: diseaseSpecificData
    };
    // 2. Evaluate Alert & Score (Using new separate service)
    // This handles History Fetching, Weighted Average, and Alert Persistence internally.
    const evaluation = await alertService.evaluateAndStoreAlert(patientId, diseaseType, submission);
    const today = new Date().toISOString().split('T')[0];
    // 3. Prepare Data for Log Storage
    const diseaseData = {
        common: commonData,
        specific: diseaseSpecificData,
        scored_at: new Date().toISOString(),
        raw_score: evaluation.score, // Storing final weighted score as the daily reference
        drivers: evaluation.drivers
    };
    // 4. Insert Daily Log
    const { data: logData, error: logError } = await admin
        .from('daily_logs')
        .insert({
        patient_id: patientId,
        log_date: today,
        disease_type: diseaseType,
        disease_data: diseaseData,
        red_flag_score: evaluation.score
    })
        .select()
        .single();
    if (logError)
        throw logError;
    // 5. Update Patient Folder Color (Doctor Dashboard)
    const { data: patient } = await admin
        .from('patients')
        .select('doctor_id, full_name')
        .eq('id', patientId)
        .single();
    if (patient?.doctor_id) {
        try {
            // Map Risk Level to Folder Color
            let folderColor = 'green';
            if (evaluation.level === 'RED')
                folderColor = 'red';
            else if (evaluation.level === 'ORANGE')
                folderColor = 'orange';
            else if (evaluation.level === 'YELLOW')
                folderColor = 'yellow';
            await doctorService.updatePatientFolder(patient.doctor_id, patientId, {
                redFlagScore: evaluation.score,
                folderColor: folderColor
            });
        }
        catch (e) {
            console.error('Failed to update patient folder', e);
            // Fallback: Try upsert if update failed (folder might not exist)
            try {
                await doctorService.upsertPatientFolder({
                    patientId,
                    doctorId: patient.doctor_id,
                    fullName: patient.full_name,
                    age: 0,
                    diseaseType,
                    lastLogDate: today,
                    folderColor: evaluation.level === 'RED' ? 'red' : evaluation.level === 'ORANGE' ? 'orange' : evaluation.level === 'YELLOW' ? 'yellow' : 'green',
                    redFlagScore: evaluation.score,
                    alertCount: 1
                });
            }
            catch (upsertError) {
                console.error('Failed to upsert folder', upsertError);
            }
        }
    }
    // Return structure compatible with frontend expectation
    return {
        logEntry: logData,
        alert: evaluation.level !== 'GREEN' ? { level: evaluation.level, score: evaluation.score, drivers: evaluation.drivers } : null,
        score: evaluation.score,
        drivers: evaluation.drivers
    };
}
async function getPatientLogs(patientId) {
    const admin = (0, supabaseClient_1.requireAdminClient)();
    const { data, error } = await admin
        .from('daily_logs')
        .select('*')
        .eq('patient_id', patientId)
        .order('log_date', { ascending: false });
    if (error)
        throw error;
    return data;
}
//# sourceMappingURL=logsService.js.map