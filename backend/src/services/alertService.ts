
import { requireAdminClient } from '../config/supabaseClient'
import { calculateDailyScore, calculateWeightedScore, getRiskLevel, AlertLevel, AlertResult } from '../scoring/scoringEngine'
// @ts-ignore
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
    const admin = requireAdminClient()

    // 1. Get Patient Baseline Data (for accurate scoring)
    const { data: patient } = await admin
        .from('patients')
        .select('patient_data, doctor_id, full_name')
        .eq('id', patientId)
        .single()

    const baselineSpO2 = safeParseFloat(patient?.patient_data?.diagnosis?.baselineSpO2) || 95;

    // 2. Calculate Today's Raw Score
    // Note: calculateDailyScore handles Immediate Critical Triggers (returns score 9 or 10 directly)
    const todayResult = calculateDailyScore(submission, baselineSpO2);

    // 3. Fetch History (Previous 2 logs) for Moving Average
    // Only fetch logs that have a valid score
    const { data: historyLogs } = await admin
        .from('daily_logs')
        .select('red_flag_score, log_date') // We use stored "red_flag_score" as the daily score
        .eq('patient_id', patientId)
        .lt('log_date', new Date().toISOString().split('T')[0])
        .order('log_date', { ascending: false })
        .limit(2)

    const scoreYest = historyLogs?.[0]?.red_flag_score || 0;
    const scoreDayBefore = historyLogs?.[1]?.red_flag_score || 0;

    // 4. Calculate Final Weighted Score
    // Rule: If Today is Critical (>=9 via Immediate Trigger), DO NOT average down. 
    let finalScore = 0;
    if (todayResult.score >= 9) {
        finalScore = todayResult.score; // Keep critical score
    } else {
        finalScore = calculateWeightedScore(todayResult.score, scoreYest, scoreDayBefore);
    }

    // Cap at 10 (just in case)
    finalScore = Math.min(finalScore, 10);

    const finalLevel = getRiskLevel(finalScore);

    // 5. Create Alert Record
    // Always store an alert record if score > 3 (Yellow/Orange/Red)
    // Or if immediate drivers exist.
    // Actually, prompt says "Store alerts in database". Maybe for every log?
    // Usually only for significant events. But for traceability, let's store if Level != GREEN.

    if (finalLevel !== 'GREEN') {
        const message = generateAlertMessage(finalLevel, finalScore, todayResult.drivers);

        await admin.from('saanssync_alerts').insert({
            patient_id: patientId,
            doctor_id: patient?.doctor_id,
            level: finalLevel,
            score: finalScore,
            reason_text: message,
            disease_type: diseaseType,
            alert_data: {
                drivers: todayResult.drivers,
                history: { today: todayResult.score, yesterday: scoreYest, dayBefore: scoreDayBefore }
            },
            acknowledged: false,
            created_at: new Date().toISOString()
        });

        // Notification Logic (Mock)
        if (finalLevel === 'RED' || finalLevel === 'ORANGE') {
            console.log(`[NOTIFY DOCTOR] Patient ${patientId} is ${finalLevel}`);
        }
        if (finalLevel === 'RED') {
            console.log(`[NOTIFY PATIENT] Emergency Alert!`);
        }
    }

    // 6. Return evaluation
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
