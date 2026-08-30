import {
    DailyLogSubmission,
    AsthmaSpecificLog,
    COPDSpecificLog,
    BronchiectasisSpecificLog,
    ILDSpecificLog,
    ScoreResult
} from '../types/shared';

export type AlertLevel = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';

export interface AlertResult {
    score: number;
    level: AlertLevel;
    drivers: string[];
}

function safeGet(obj: any, key: string, defaultValue: number = 0): number {
    if (!obj) return defaultValue;

    if (typeof obj[key] === 'number') return obj[key];
    if (typeof obj[key] === 'string') {
        const p = parseFloat(obj[key]);
        return isNaN(p) ? defaultValue : p;
    }

    if (obj.symptoms && typeof obj.symptoms[key] === 'number') return obj.symptoms[key];
    if (obj.symptoms && typeof obj.symptoms[key] === 'string') {
        const p = parseFloat(obj.symptoms[key]);
        return isNaN(p) ? defaultValue : p;
    }

    if (obj.daily && typeof obj.daily[key] === 'number') return obj.daily[key];
    if (obj.daily && typeof obj.daily[key] === 'string') {
        const p = parseFloat(obj.daily[key]);
        return isNaN(p) ? defaultValue : p;
    }

    return defaultValue;
}

function safeBool(obj: any, key: string): boolean {
    if (!obj) return false;
    if (typeof obj[key] === 'boolean') return obj[key];
    if (obj.symptoms && typeof obj.symptoms[key] === 'boolean') return obj.symptoms[key];
    if (obj.daily && typeof obj.daily[key] === 'boolean') return obj.daily[key];
    if (obj.control && typeof obj.control[key] === 'boolean') return obj.control[key];
    if (obj.infectionScreen && typeof obj.infectionScreen[key] === 'boolean') return obj.infectionScreen[key];
    return false;
}

function checkCriticalTriggers(log: DailyLogSubmission, baselineSpO2: number = 95): AlertResult | null {
    const common = log.common;
    const disease = log.diseaseType;

    const sputumColor = (log.specific as any)?.sputum?.color || (log.specific as any)?.sputumColor;
    if ((disease === 'Bronchiectasis' || disease === 'Post ICU Recovery') && sputumColor === 'Red/Rusty') {
        return { score: 10, level: 'RED', drivers: ['Hemoptysis (Rusty/Red Sputum)'] };
    }

    const spo2AtRest = common?.spo2?.atRest ?? (common as any)?.spo2AtRest ?? 95;
    if (spo2AtRest < 85) {
        return { score: 10, level: 'RED', drivers: ['SpO2 < 85% (Critical Hypoxia)'] };
    }

    const others = (common?.symptoms as any)?.others || (common as any)?.others || "";
    const chestPain = others.toLowerCase()?.includes('chest pain') || false;

    const vasScore = (common?.symptoms as any)?.vasScore ?? (common as any)?.vasScore ?? 0;
    if (vasScore > 8) {
        return { score: 9, level: 'RED', drivers: ['Severe Symptom Score (VAS > 8)'] };
    }

    const spo2OnExertion = common?.spo2?.onExertion ?? (common as any)?.spo2OnExertion ?? 95;
    if (spo2AtRest - spo2OnExertion > 10) {
        return { score: 9, level: 'RED', drivers: ['Massive Exertional SpO2 Drop (>10%)'] };
    }

    return null;
}

export function calculateDailyScore(log: DailyLogSubmission, baselineSpO2: number = 95): AlertResult {

    const critical = checkCriticalTriggers(log, baselineSpO2);
    if (critical) return critical;

    let points = 1;
    const drivers: string[] = [];
    const common = log.common;
    const disease = log.diseaseType;

    const spo2ThresholdValue = disease.includes('COPD') ? 88 : 90;
    const currentAtRest = common?.spo2?.atRest ?? (common as any)?.spo2AtRest ?? 95;
    if (currentAtRest < spo2ThresholdValue) {
        points += 5;
        drivers.push(`SpO2 < ${spo2ThresholdValue}%`);
    }

    const mrcValue = Number(common?.mMRCScore ?? (common as any)?.mMRCScale ?? 0);
    if (mrcValue >= 3) {
        points += 2;
        drivers.push('High mMRC Score (>=3)');
    }

    if (common?.aqi && (common.aqi.pm25 > 200 || (common.aqi as any).value > 200)) {
        points += 1;
        drivers.push('AQI > 200');
    }

    const medAdherenceInput = common?.medicationAdherence || (common as any)?.medications || [];
    const medsMissedStatus = Array.isArray(medAdherenceInput) && medAdherenceInput.some((m: any) => !m.taken);
    if (medsMissedStatus) {
        points += 1;
        drivers.push('Maintenance Meds Missed');
    }

    const currentVas = (common?.symptoms as any)?.vasScore ?? (common as any)?.vasScore ?? 0;
    if (currentVas > 7) {
        points += 2;
        drivers.push('Severe Symptoms (VAS > 7)');
    }

    try {
        switch (disease) {
            case 'Bronchial Asthma': {
                const asthma = log.specific;

                if (safeBool(asthma, 'nightWaking')) {
                    points += 3;
                    drivers.push('Night Waking');
                }

                const rescuePuffs = safeGet(asthma, 'rescuePuffs', (asthma as any)?.rescuePuffsToday || 0);
                if (rescuePuffs > 4) {
                    points += 3;
                    drivers.push('Rescue Inhaler > 4 puffs');
                }

                const pefr = safeGet(asthma, 'pefr');
                if (pefr > 0 && pefr < 60) {
                    return { score: 9, level: 'RED', drivers: ['PEFR < 60% Personal Best'] };
                }
                break;
            }

            case 'COPD': {
                const copd = log.specific;

                const phlegm = safeGet(copd, 'phlegmProduction');
                if (phlegm >= 3) {
                    points += 4;
                    drivers.push('High Phlegm Production (Purulence proxy)');
                }

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

                if (spColor === 'Green') {
                    points += 4;
                    drivers.push('Green Sputum');
                }

                if (spVol === 'Large' || spVol === 'Large amount') {
                    points += 2;
                    drivers.push('Large Sputum Volume');
                }

                if (safeBool(bronch, 'malaise')) {
                    points += 2;
                    drivers.push('Malaise');
                }
                break;
            }

            case 'Interstitial Lung Disease (ILD)': {
                const ild = log.specific;

                if (baselineSpO2 - common.spo2.atRest >= 3) {
                    points += 3;
                    drivers.push('SpO2 Drop >= 3% from Baseline');
                }

                const coughChange = safeGet(ild, 'dryCoughFrequencyChange');
                if (coughChange >= 1) {
                    points += 3;
                    drivers.push('Worsening Dry Cough');
                }

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

    }

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

export function calculateWeightedScore(today: number, yesterday: number, dayBefore: number): number {
    const raw = (0.5 * today) + (0.3 * yesterday) + (0.2 * dayBefore);

    return Math.round(raw * 10) / 10;
}
