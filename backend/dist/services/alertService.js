"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateAndStoreAlert = evaluateAndStoreAlert;
const db_1 = __importDefault(require("../config/db"));
const scoringEngine_1 = require("../scoring/scoringEngine");
async function evaluateAndStoreAlert(patientId, diseaseType, submission) {
    const patient = await db_1.default.patient.findUnique({
        where: { id: patientId },
        select: { patientData: true, doctorId: true, fullName: true }
    });
    const patientData = patient?.patientData;
    const baselineSpO2 = safeParseFloat(patientData?.diagnosis?.baselineSpO2) || 95;
    const todayResult = (0, scoringEngine_1.calculateDailyScore)(submission, baselineSpO2);
    const historyLogs = await db_1.default.dailyLog.findMany({
        where: {
            patientId,
            logDate: { lt: new Date(new Date().toISOString().split('T')[0]) }
        },
        select: { redFlagScore: true, logDate: true },
        orderBy: { logDate: 'desc' },
        take: 2
    });
    const scoreYest = Number(historyLogs?.[0]?.redFlagScore || 0);
    const scoreDayBefore = Number(historyLogs?.[1]?.redFlagScore || 0);
    let finalScore = 0;
    if (todayResult.score >= 9) {
        finalScore = todayResult.score;
    }
    else {
        finalScore = (0, scoringEngine_1.calculateWeightedScore)(todayResult.score, scoreYest, scoreDayBefore);
    }
    finalScore = Math.min(finalScore, 10);
    const finalLevel = (0, scoringEngine_1.getRiskLevel)(finalScore);
    if (finalLevel !== 'GREEN') {
        const message = generateAlertMessage(finalLevel, finalScore, todayResult.drivers);
        await db_1.default.alert.create({
            data: {
                patientId,
                doctorId: patient?.doctorId,
                level: finalLevel,
                score: finalScore,
                reasonText: message,
                diseaseType,
                alertData: {
                    drivers: todayResult.drivers,
                    history: { today: todayResult.score, yesterday: scoreYest, dayBefore: scoreDayBefore }
                },
                acknowledged: false,
                createdAt: new Date()
            }
        });
        if (finalLevel === 'RED' || finalLevel === 'ORANGE') {
            console.log(`[NOTIFY DOCTOR] Patient ${patientId} is ${finalLevel}`);
        }
        if (finalLevel === 'RED') {
            console.log(`[NOTIFY PATIENT] Emergency Alert!`);
        }
    }
    return {
        score: finalScore,
        level: finalLevel,
        drivers: todayResult.drivers,
        is_manual_override: false
    };
}
function safeParseFloat(val) {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
}
function generateAlertMessage(level, score, drivers) {
    const driversText = drivers.length > 0 ? ` Drivers: ${drivers.join(', ')}` : '';
    return `Risk Level ${level} (Score ${score}).${driversText}`;
}
//# sourceMappingURL=alertService.js.map