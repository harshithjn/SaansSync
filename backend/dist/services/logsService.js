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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDailyLog = createDailyLog;
exports.getPatientLogs = getPatientLogs;
const db_1 = __importDefault(require("../config/db"));
const alertService = __importStar(require("./alertService"));
const doctorService = __importStar(require("./doctorService"));
async function createDailyLog(payload) {
    const { patientId, diseaseType, commonData, diseaseSpecificData } = payload;
    // 1. Prepare submission object
    const submission = {
        patientId,
        diseaseType,
        common: commonData,
        specific: diseaseSpecificData
    };
    // 2. Evaluate Alert & Score
    const evaluation = await alertService.evaluateAndStoreAlert(patientId, diseaseType, submission);
    const today = new Date().toISOString().split('T')[0];
    // 3. Prepare Data for Log Storage
    const diseaseData = {
        common: commonData,
        specific: diseaseSpecificData,
        scored_at: new Date().toISOString(),
        raw_score: evaluation.score,
        drivers: evaluation.drivers
    };
    // 4. Insert Daily Log
    const logData = await db_1.default.dailyLog.create({
        data: {
            patientId,
            logDate: new Date(today),
            diseaseType,
            diseaseData,
            redFlagScore: evaluation.score
        }
    });
    // 5. Update Patient Folder Color
    try {
        const patient = await db_1.default.patient.findUnique({
            where: { id: patientId },
            select: { doctorId: true, fullName: true }
        });
        if (patient?.doctorId) {
            let folderColor = 'green';
            if (evaluation.level === 'RED')
                folderColor = 'red';
            else if (evaluation.level === 'ORANGE')
                folderColor = 'orange';
            else if (evaluation.level === 'YELLOW')
                folderColor = 'yellow';
            try {
                await doctorService.updatePatientFolder(patient.doctorId, patientId, {
                    redFlagScore: evaluation.score,
                    folderColor: folderColor
                });
            }
            catch (e) {
                console.error('Failed to update patient folder, trying upsert', e);
                await doctorService.upsertPatientFolder({
                    patientId,
                    doctorId: patient.doctorId,
                    fullName: patient.fullName,
                    age: 0,
                    diseaseType,
                    lastLogDate: today,
                    folderColor: folderColor,
                    redFlagScore: evaluation.score,
                    alertCount: 1
                });
            }
        }
    }
    catch (e) {
        console.error('Non-critical secondary update failed (folders):', e);
    }
    return {
        logEntry: logData,
        alert: evaluation.level !== 'GREEN' ? { level: evaluation.level, score: evaluation.score, drivers: evaluation.drivers } : null,
        score: evaluation.score,
        drivers: evaluation.drivers
    };
}
async function getPatientLogs(patientId) {
    return await db_1.default.dailyLog.findMany({
        where: { patientId },
        orderBy: { logDate: 'desc' }
    });
}
//# sourceMappingURL=logsService.js.map