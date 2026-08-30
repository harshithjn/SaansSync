import prisma from '../config/db'
import { calculateDailyScore, calculateWeightedScore, getRiskLevel, AlertLevel, AlertResult } from '../scoring/scoringEngine'

import { DailyLogSubmission } from '../types/shared'

export interface EvaluatedAlert {
    score: number;
    level: AlertLevel;
    drivers: string[];
    is_manual_override: boolean;
}

export async function evaluateAndStoreAlert(
    patientId: string,
    diseaseType: string,
    submission: DailyLogSubmission
): Promise<EvaluatedAlert> {
    const patient = await prisma.patient.findUnique({
        where: { id: patientId },
        select: { patientData: true, doctorId: true, fullName: true }
    });

    const patientData = patient?.patientData as any;
    const baselineSpO2 = safeParseFloat(patientData?.diagnosis?.baselineSpO2) || 95;

    const todayResult = calculateDailyScore(submission, baselineSpO2);

    const historyLogs = await prisma.dailyLog.findMany({
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
    } else {
        finalScore = calculateWeightedScore(todayResult.score, scoreYest, scoreDayBefore);
    }

    finalScore = Math.min(finalScore, 10);
    const finalLevel = getRiskLevel(finalScore);

    if (finalLevel !== 'GREEN') {
        const message = generateAlertMessage(finalLevel, finalScore, todayResult.drivers);

        await prisma.alert.create({
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

function safeParseFloat(val: any): number {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
}

function generateAlertMessage(level: string, score: number, drivers: string[]): string {
    const driversText = drivers.length > 0 ? ` Drivers: ${drivers.join(', ')}` : '';
    return `Risk Level ${level} (Score ${score}).${driversText}`;
}
