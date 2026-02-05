
// @ts-ignore
import {
    DailyLogSubmission,
    AsthmaSpecificLog,
    COPDSpecificLog,
    BronchiectasisSpecificLog,
    ILDSpecificLog,
    ScoreResult
} from '../types/shared';


// =========================================================
// ALERT & SCORING CONFIGURATION
// =========================================================

export type AlertLevel = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';

export interface AlertResult {
    score: number;
    level: AlertLevel;
    drivers: string[];
}

/**
 * Robust helper to get a numeric value from a potentially flat or nested structure.
 * Handles: obj.key, obj.symptoms.key, obj.daily.key
 */
function safeGet(obj: any, key: string, defaultValue: number = 0): number {
    if (!obj) return defaultValue;

    // 1. Direct access (flat structure)
    if (typeof obj[key] === 'number') return obj[key];
    if (typeof obj[key] === 'string') {
        const p = parseFloat(obj[key]);
        return isNaN(p) ? defaultValue : p;
    }

    // 2. Nested symptoms
    if (obj.symptoms && typeof obj.symptoms[key] === 'number') return obj.symptoms[key];
    if (obj.symptoms && typeof obj.symptoms[key] === 'string') {
        const p = parseFloat(obj.symptoms[key]);
        return isNaN(p) ? defaultValue : p;
    }

    // 3. Nested daily
    if (obj.daily && typeof obj.daily[key] === 'number') return obj.daily[key];
    if (obj.daily && typeof obj.daily[key] === 'string') {
        const p = parseFloat(obj.daily[key]);
        return isNaN(p) ? defaultValue : p;
    }

    return defaultValue;
}

/**
 * Robust helper for boolean flags
 */
function safeBool(obj: any, key: string): boolean {
    if (!obj) return false;
    if (typeof obj[key] === 'boolean') return obj[key];
    if (obj.symptoms && typeof obj.symptoms[key] === 'boolean') return obj.symptoms[key];
    if (obj.daily && typeof obj.daily[key] === 'boolean') return obj.daily[key];
    if (obj.control && typeof obj.control[key] === 'boolean') return obj.control[key];
    if (obj.infectionScreen && typeof obj.infectionScreen[key] === 'boolean') return obj.infectionScreen[key];
    return false;
}

// B) IMMEDIATE CRITICAL TRIGGERS (Auto-Score 9 or 10)
function checkCriticalTriggers(log: DailyLogSubmission, baselineSpO2: number = 95): AlertResult | null {
    const common = log.common;
    const disease = log.diseaseType;

    // Hemoptysis (Massive or present depending on rules)
    // Bronchiectasis/Post-ICU: Hemoptysis -> 10
    const sputumColor = (log.specific as any)?.sputum?.color || (log.specific as any)?.sputumColor;
    if ((disease === 'Bronchiectasis' || disease === 'Post ICU Recovery') && sputumColor === 'Red/Rusty') {
        return { score: 10, level: 'RED', drivers: ['Hemoptysis (Rusty/Red Sputum)'] };
    }
    // Asthma: "Hemoptysis present" (Usually checked in specific logs or common "side effects" / "other")
    // For now, if "Red/Rusty" is selected in available fields, or symptom text contains it.
    // In our types, simple Hemoptysis isn't explicitly top-level common, but often under symptoms.

    // SpO2 < 85%
    const spo2AtRest = common?.spo2?.atRest ?? (common as any)?.spo2AtRest ?? 95;
    if (spo2AtRest < 85) {
        return { score: 10, level: 'RED', drivers: ['SpO2 < 85% (Critical Hypoxia)'] };
    }

    // Severe Chest Pain (VAS > 8)
    const others = (common?.symptoms as any)?.others || (common as any)?.others || "";
    const chestPain = others.toLowerCase()?.includes('chest pain') || false;

    const vasScore = (common?.symptoms as any)?.vasScore ?? (common as any)?.vasScore ?? 0;
    if (vasScore > 8) {
        return { score: 9, level: 'RED', drivers: ['Severe Symptom Score (VAS > 8)'] };
    }

    // Massive exertional SpO2 drop (>10%)
    const spo2OnExertion = common?.spo2?.onExertion ?? (common as any)?.spo2OnExertion ?? 95;
    if (spo2AtRest - spo2OnExertion > 10) {
        return { score: 9, level: 'RED', drivers: ['Massive Exertional SpO2 Drop (>10%)'] };
    }

    // Respiratory Rate is not in DailyLogCommon yet. Assuming not available or derived?
    // We will skip RR if not in payload.

    return null;
}


// =========================================================
// MAIN SCORING ENGINE
// =========================================================

export function calculateDailyScore(log: DailyLogSubmission, baselineSpO2: number = 95): AlertResult {
    // 1. Check Critical Triggers first
    const critical = checkCriticalTriggers(log, baselineSpO2);
    if (critical) return critical;

    let points = 1; // Base score starts at 1
    const drivers: string[] = [];
    const common = log.common;
    const disease = log.diseaseType;

    // --- C) COMMON METRIC SCORING ---

    // SpO2 < 90% (<88% for COPD) -> +5
    const spo2ThresholdValue = disease.includes('COPD') ? 88 : 90;
    const currentAtRest = common?.spo2?.atRest ?? (common as any)?.spo2AtRest ?? 95;
    if (currentAtRest < spo2ThresholdValue) {
        points += 5;
        drivers.push(`SpO2 < ${spo2ThresholdValue}%`);
    }

    // mMRC increase by >= 1 -> +2
    const mrcValue = Number(common?.mMRCScore ?? (common as any)?.mMRCScale ?? 0);
    if (mrcValue >= 3) {
        points += 2;
        drivers.push('High mMRC Score (>=3)');
    }

    // AQI > 200 -> +1
    if (common?.aqi && (common.aqi.pm25 > 200 || (common.aqi as any).value > 200)) {
        points += 1;
        drivers.push('AQI > 200');
    }

    // Maintenance meds not taken -> +1
    const medAdherenceInput = common?.medicationAdherence || (common as any)?.medications || [];
    const medsMissedStatus = Array.isArray(medAdherenceInput) && medAdherenceInput.some((m: any) => !m.taken);
    if (medsMissedStatus) {
        points += 1;
        drivers.push('Maintenance Meds Missed');
    }

    // Any symptom VAS > 7 -> +2
    const currentVas = (common?.symptoms as any)?.vasScore ?? (common as any)?.vasScore ?? 0;
    if (currentVas > 7) {
        points += 2;
        drivers.push('Severe Symptoms (VAS > 7)');
    }


    try {
        switch (disease) {
            case 'Bronchial Asthma': {
                const asthma = log.specific;
                // Night waking -> +3
                if (safeBool(asthma, 'nightWaking')) {
                    points += 3;
                    drivers.push('Night Waking');
                }
                // Rescue inhaler >4 puffs/day -> +3
                const rescuePuffs = safeGet(asthma, 'rescuePuffs', (asthma as any)?.rescuePuffsToday || 0);
                if (rescuePuffs > 4) {
                    points += 3;
                    drivers.push('Rescue Inhaler > 4 puffs');
                }
                // PEFR < 60% -> Auto 9
                const pefr = safeGet(asthma, 'pefr');
                if (pefr > 0 && pefr < 60) {
                    return { score: 9, level: 'RED', drivers: ['PEFR < 60% Personal Best'] };
                }
                break;
            }

            case 'COPD': {
                const copd = log.specific;
                // Sputum purulence -> +4
                const phlegm = safeGet(copd, 'phlegmProduction');
                if (phlegm >= 3) {
                    points += 4;
                    drivers.push('High Phlegm Production (Purulence proxy)');
                }

                // Chest tightness VAS > 7 -> +2
                const chestTightness = safeGet(copd, 'chestTightnessVas', (copd as any)?.chestHeaviness || 0);
                if (chestTightness > 7) {
                    points += 2;
                    drivers.push('Chest Tightness > 7');
                }
                break;
            }

            case 'Bronchiectasis':
            case 'Post ICU Recovery': {
                const bronch = log.specific as any;
                const spColor = bronch?.sputum?.color || bronch?.sputumColor;
                const spVol = bronch?.sputum?.volume || bronch?.sputumVolume;

                // Green sputum -> +4
                if (spColor === 'Green') {
                    points += 4;
                    drivers.push('Green Sputum');
                }
                // Large sputum volume -> +2
                if (spVol === 'Large' || spVol === 'Large amount') {
                    points += 2;
                    drivers.push('Large Sputum Volume');
                }
                // Malaise -> +2
                if (safeBool(bronch, 'malaise')) {
                    points += 2;
                    drivers.push('Malaise');
                }
                break;
            }

            case 'Interstitial Lung Disease (ILD)': {
                const ild = log.specific;
                // SpO2 drop >= 3% from baseline -> +3
                if (baselineSpO2 - common.spo2.atRest >= 3) {
                    points += 3;
                    drivers.push('SpO2 Drop >= 3% from Baseline');
                }
                // Dry cough increase -> +3
                const coughChange = safeGet(ild, 'dryCoughFrequencyChange');
                if (coughChange >= 1) {
                    points += 3;
                    drivers.push('Worsening Dry Cough');
                }
                // Breathlessness at rest -> +4
                const bAtRest = safeGet(ild, 'breathlessnessAtRest');
                if (bAtRest > 3) {
                    points += 4;
                    drivers.push('Breathlessness at Rest');
                }
                break;
            }
        }
    } catch (e) {
        console.error('Scoring Engine specific logic error:', e);
        // Continue with base points if specific logic fails
    }

    // Cap at 10
    const finalScore = Math.min(points, 10);

    return {
        score: finalScore,
        level: getRiskLevel(finalScore),
        drivers
    };
}

export function getRiskLevel(score: number): AlertLevel {
    if (score >= 9) return 'RED';
    if (score >= 7) return 'ORANGE';
    if (score >= 4) return 'YELLOW';
    return 'GREEN';
}

// =========================================================
// 3-DAY MOVING AVERAGE CALCULATOR
// =========================================================

export function calculateWeightedScore(today: number, yesterday: number, dayBefore: number): number {
    const raw = (0.5 * today) + (0.3 * yesterday) + (0.2 * dayBefore);
    // Round to 1 decimal
    return Math.round(raw * 10) / 10;
}
