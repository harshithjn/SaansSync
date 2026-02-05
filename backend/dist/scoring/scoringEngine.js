"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDailyScore = calculateDailyScore;
exports.getRiskLevel = getRiskLevel;
exports.calculateWeightedScore = calculateWeightedScore;
// B) IMMEDIATE CRITICAL TRIGGERS (Auto-Score 9 or 10)
function checkCriticalTriggers(log, baselineSpO2 = 95) {
    const common = log.common;
    const disease = log.diseaseType;
    // Hemoptysis (Massive or present depending on rules)
    // Bronchiectasis/Post-ICU: Hemoptysis -> 10
    if ((disease === 'Bronchiectasis' || disease === 'Post ICU Recovery') && log.specific.sputum.color === 'Red/Rusty') {
        return { score: 10, level: 'RED', drivers: ['Hemoptysis (Rusty/Red Sputum)'] };
    }
    // Asthma: "Hemoptysis present" (Usually checked in specific logs or common "side effects" / "other")
    // For now, if "Red/Rusty" is selected in available fields, or symptom text contains it.
    // In our types, simple Hemoptysis isn't explicitly top-level common, but often under symptoms.
    // SpO2 < 85%
    if (common.spo2.atRest < 85) {
        return { score: 10, level: 'RED', drivers: ['SpO2 < 85% (Critical Hypoxia)'] };
    }
    // Severe Chest Pain (VAS > 8)
    const chestPain = common.symptoms.others?.toLowerCase()?.includes('chest pain') || false; // Or explicit field
    // In our log structure, we have symptoms array. We need to check identifying string or ID.
    // Assuming symptom name "Chest Pain" or specific field. 
    // In current patient-types, symptoms is an object with { vasScore, ... }? 
    // Wait, let's look at `DailyLogCommon` in patient-types.ts again. 
    // It says: symptoms: { vasScore: number; ... others?: string }
    // It seems user wants individual symptom scores (Chest Pain, etc.) but the type has one `vasScore`?
    // Let's re-read patient-types.ts. 
    // Ah, the file view showed: 
    // symptoms: { vasScore: number; previousVasScore?: number; hasPedalEdema: boolean; others?: string; }
    // BUT the user prompt says "Any symptom VAS >7 → +2". 
    // And "Chest tightness VAS >7".
    // This implies we might need extended types or map `vasScore` generally.
    // If the frontend sends multiple symptoms, we need to adapt.
    // For now, we will use `common.symptoms.vasScore` as "General Symptom Score" if specific ones aren't mapped.
    if (common.symptoms.vasScore > 8) {
        // This might cover chest pain if that's the primary symptom reported.
        return { score: 9, level: 'RED', drivers: ['Severe Symptom Score (VAS > 8)'] };
    }
    // Massive exertional SpO2 drop (>10%)
    if (common.spo2.atRest - common.spo2.onExertion > 10) {
        return { score: 9, level: 'RED', drivers: ['Massive Exertional SpO2 Drop (>10%)'] };
    }
    // Respiratory Rate is not in DailyLogCommon yet. Assuming not available or derived?
    // We will skip RR if not in payload.
    return null;
}
// =========================================================
// MAIN SCORING ENGINE
// =========================================================
function calculateDailyScore(log, baselineSpO2 = 95) {
    // 1. Check Critical Triggers first
    const critical = checkCriticalTriggers(log, baselineSpO2);
    if (critical)
        return critical;
    let points = 1; // Base score starts at 1
    const drivers = [];
    const common = log.common;
    const disease = log.diseaseType;
    // --- C) COMMON METRIC SCORING ---
    // SpO2 < 90% (<88% for COPD) -> +5
    const spo2Threshold = disease.includes('COPD') ? 88 : 90;
    if (common.spo2.atRest < spo2Threshold) {
        points += 5;
        drivers.push(`SpO2 < ${spo2Threshold}%`);
    }
    // mMRC increase by >= 1 -> +2
    // We need baseline mMRC to know "increase". Assuming `2` (avg) if unknown, or passed in.
    // Ideally we pass baselineMrc. For now, if mMRC >= 3 we assume it's high/increased.
    // Or if `mMRCScore` is high. 
    const mrc = Number(common.mMRCScore);
    if (mrc >= 3) {
        points += 2;
        drivers.push('High mMRC Score (>=3)');
    }
    // AQI > 200 -> +1
    if (common.aqi && common.aqi.pm25 > 200) {
        points += 1;
        drivers.push('AQI > 200');
    }
    // Maintenance meds not taken -> +1
    const medsNotTaken = common.medicationAdherence.some(m => !m.taken);
    if (medsNotTaken) {
        points += 1;
        drivers.push('Maintenance Meds Missed');
    }
    // Any symptom VAS > 7 -> +2
    if (common.symptoms.vasScore > 7) {
        points += 2;
        drivers.push('Severe Symptoms (VAS > 7)');
    }
    // --- D) DISEASE-SPECIFIC SCORING ---
    switch (disease) {
        case 'Bronchial Asthma': {
            const asthma = log.specific;
            // Night waking -> +3
            if (asthma.control.nightWaking) {
                points += 3;
                drivers.push('Night Waking');
            }
            // Rescue inhaler >4 puffs/day -> +3
            if (asthma.daily.rescuePuffs > 4) {
                points += 3;
                drivers.push('Rescue Inhaler > 4 puffs');
            }
            // PEFR < 60% -> Auto 9
            // Assuming PEFR is liters, need baseline. 
            // If pefr is RAW value, we can't know %. 
            // If pefr provided is PERCENT PREDICTED, then:
            if (asthma.daily.pefr < 60) {
                return { score: 9, level: 'RED', drivers: ['PEFR < 60% Personal Best'] };
            }
            break;
        }
        case 'COPD': {
            const copd = log.specific;
            // Sputum purulence -> +4 (If logic implies purulence based on color/volume?)
            // Usually "Green" or "Yellow" + Volume.
            // Copd log has symptoms: coughFrequency, phlegmProduction.
            // Needs color check if available in extended types. 
            // patient-types says: COPDSpecificLog has NO sputum color?
            // Wait, Bronchiectasis has sputum color. COPD currently in types:
            // symptoms: { coughFrequency, phlegmProduction... }, daily: { energyVas... }
            // If we can't check color, we use Phlegm Production high as proxy?
            if (copd.symptoms.phlegmProduction >= 3) {
                points += 4;
                drivers.push('High Phlegm Production (Purulence proxy)');
            }
            // Chest tightness VAS > 7 -> +2
            if (copd.daily.chestTightnessVas > 7) {
                points += 2;
                drivers.push('Chest Tightness > 7');
            }
            // Fever -> +3 (Not in COPD specific type explicitly, maybe in common symptoms "others" or specialized field?)
            // We'll check common fields if we can find fever.
            break;
        }
        case 'Bronchiectasis':
        case 'Post ICU Recovery': {
            const bronch = log.specific;
            // Green sputum -> +4
            if (bronch.sputum.color === 'Green') {
                points += 4;
                drivers.push('Green Sputum');
            }
            // Large sputum volume -> +2
            if (bronch.sputum.volume === 'Large') {
                points += 2;
                drivers.push('Large Sputum Volume');
            }
            // Malaise -> +2
            if (bronch.infectionScreen.malaise) {
                points += 2;
                drivers.push('Malaise');
            }
            // Hemoptysis -> 10 (Handled in Critical Triggers if color Red/Rusty)
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
            if (ild.dryCoughFrequencyChange >= 1) { // Assuming scale 0-4, change > 0
                points += 3;
                drivers.push('Worsening Dry Cough');
            }
            // Breathlessness at rest -> +4
            if (ild.breathlessnessAtRest > 3) { // Threshold?
                points += 4;
                drivers.push('Breathlessness at Rest');
            }
            break;
        }
    }
    // Cap at 10
    const finalScore = Math.min(points, 10);
    return {
        score: finalScore,
        level: getRiskLevel(finalScore),
        drivers
    };
}
function getRiskLevel(score) {
    if (score >= 9)
        return 'RED';
    if (score >= 7)
        return 'ORANGE';
    if (score >= 4)
        return 'YELLOW';
    return 'GREEN';
}
// =========================================================
// 3-DAY MOVING AVERAGE CALCULATOR
// =========================================================
function calculateWeightedScore(today, yesterday, dayBefore) {
    const raw = (0.5 * today) + (0.3 * yesterday) + (0.2 * dayBefore);
    // Round to 1 decimal
    return Math.round(raw * 10) / 10;
}
//# sourceMappingURL=scoringEngine.js.map