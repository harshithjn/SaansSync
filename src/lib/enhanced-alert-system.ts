// Enhanced Alert System for ILD and Asthma with Rule-based + Score-based Logic
import { PatientData } from './patient-types'

export type AlertLevel = 'RED' | 'YELLOW' | 'GREEN'
export type DiseaseType = 'ILD' | 'ASTHMA' | 'COPD' | 'BRONCHIECTASIS' | 'POST_ICU'

export interface PatientLogData {
    patientId: string
    logDate: string
    diseaseType: DiseaseType

    // Vitals
    spo2AtRest: number
    spo2OnExertion: number
    mMRCScale: number

    // Symptoms (VAS 0-10)
    breathlessness: number
    dryCough?: number
    cough: number
    chestPain: number
    fever: number
    pedalEdema: number
    wheezing: number
    fatigue?: number

    // Disease-specific
    hemoptysis?: boolean
    oxygenRequirement?: number
    baselineOxygen?: number
    kbildScore?: number
    baselineKBILD?: number
    peakFlowPercent?: number

    // Asthma-specific
    rescueInhalerPuffs?: number
    nightWaking?: boolean
    daytimeSymptoms?: boolean
    activityLimitation?: boolean
    relieverUse?: boolean
    controlLevel?: 'well-controlled' | 'partly-controlled' | 'poorly-controlled'

    // COPD-specific
    energyLevel?: number
    chestHeaviness?: number
    sputumVolume?: 'none' | 'small' | 'moderate' | 'large'
    sputumColor?: string
    sleepDisturbed?: boolean
    exerciseTolerance?: boolean

    // Bronchiectasis/Post-ICU specific
    malaise?: boolean

    // Medications
    antiFibroticsTaken?: boolean
    medicationCompliance: boolean
    inhalersTaken?: boolean

    // Side Effects
    newRash?: boolean
    severeDiarrhea?: boolean
    hasSideEffects?: boolean

    // Baseline comparisons
    baselineSpO2?: number
    baselinemMRC?: number

    // Subjective assessment
    breathlessnessComparison?: 'better' | 'same' | 'worse'
}

export interface AlertResult {
    level: AlertLevel
    score: number
    finalScore: number
    triggers: string[]
    recommendations: string[]
    timestamp: string
    patientId: string
    diseaseType: DiseaseType
}

export interface HistoricalScore {
    date: string
    score: number
    level: AlertLevel
}

// Storage keys
const ALERT_HISTORY_KEY = 'patient_alert_history'
const PATIENT_BASELINES_KEY = 'patient_baselines'
const ASTHMA_CONTROL_HISTORY_KEY = 'asthma_control_history'
const RESCUE_INHALER_HISTORY_KEY = 'rescue_inhaler_history'

// Track asthma control history for consecutive days logic
export function storeAsthmaControlHistory(patientId: string, controlLevel: string, rescueInhalerPuffs: number): void {
    if (typeof window === 'undefined') return

    try {
        const today = new Date().toISOString().split('T')[0]

        // Store control history
        const controlStored = localStorage.getItem(ASTHMA_CONTROL_HISTORY_KEY)
        const controlHistory: { [patientId: string]: { date: string, controlLevel: string }[] } = controlStored ? JSON.parse(controlStored) : {}

        if (!controlHistory[patientId]) {
            controlHistory[patientId] = []
        }

        // Remove today's entry if it exists, then add new one
        controlHistory[patientId] = controlHistory[patientId].filter(entry => entry.date !== today)
        controlHistory[patientId].push({ date: today, controlLevel })

        // Keep only last 30 days
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        controlHistory[patientId] = controlHistory[patientId].filter(entry => new Date(entry.date) >= thirtyDaysAgo)

        localStorage.setItem(ASTHMA_CONTROL_HISTORY_KEY, JSON.stringify(controlHistory))

        // Store rescue inhaler history
        const inhalerStored = localStorage.getItem(RESCUE_INHALER_HISTORY_KEY)
        const inhalerHistory: { [patientId: string]: { date: string, puffs: number }[] } = inhalerStored ? JSON.parse(inhalerStored) : {}

        if (!inhalerHistory[patientId]) {
            inhalerHistory[patientId] = []
        }

        // Remove today's entry if it exists, then add new one
        inhalerHistory[patientId] = inhalerHistory[patientId].filter(entry => entry.date !== today)
        inhalerHistory[patientId].push({ date: today, puffs: rescueInhalerPuffs })

        // Keep only last 30 days
        inhalerHistory[patientId] = inhalerHistory[patientId].filter(entry => new Date(entry.date) >= thirtyDaysAgo)

        localStorage.setItem(RESCUE_INHALER_HISTORY_KEY, JSON.stringify(inhalerHistory))
    } catch (error) {
        console.error('Error storing asthma control history:', error)
    }
}

// Check for consecutive days of poor control
export function hasConsecutivePoorControl(patientId: string, days: number = 2): boolean {
    if (typeof window === 'undefined') return false

    try {
        const stored = localStorage.getItem(ASTHMA_CONTROL_HISTORY_KEY)
        const history: { [patientId: string]: { date: string, controlLevel: string }[] } = stored ? JSON.parse(stored) : {}

        if (!history[patientId] || history[patientId].length < days) {
            return false
        }

        // Sort by date descending (most recent first)
        const sortedHistory = history[patientId].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        // Check if the last 'days' entries are all poorly controlled
        for (let i = 0; i < days && i < sortedHistory.length; i++) {
            if (sortedHistory[i].controlLevel !== 'poorly-controlled') {
                return false
            }
        }

        return true
    } catch (error) {
        console.error('Error checking consecutive poor control:', error)
        return false
    }
}

// Check rescue inhaler usage patterns
export function checkRescueInhalerPattern(patientId: string): { moreThan4For2Days: boolean, moreThan6Today: boolean } {
    if (typeof window === 'undefined') return { moreThan4For2Days: false, moreThan6Today: false }

    try {
        const stored = localStorage.getItem(RESCUE_INHALER_HISTORY_KEY)
        const history: { [patientId: string]: { date: string, puffs: number }[] } = stored ? JSON.parse(stored) : {}

        if (!history[patientId]) {
            return { moreThan4For2Days: false, moreThan6Today: false }
        }

        // Sort by date descending (most recent first)
        const sortedHistory = history[patientId].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        // Check if >6 puffs today
        const moreThan6Today = sortedHistory.length > 0 && sortedHistory[0].puffs > 6

        // Check if >4 puffs for 2+ consecutive days
        let moreThan4For2Days = false
        if (sortedHistory.length >= 2) {
            moreThan4For2Days = sortedHistory[0].puffs > 4 && sortedHistory[1].puffs > 4
        }

        return { moreThan4For2Days, moreThan6Today }
    } catch (error) {
        console.error('Error checking rescue inhaler pattern:', error)
        return { moreThan4For2Days: false, moreThan6Today: false }
    }
}

// Store alert history
export function storeAlertHistory(patientId: string, alertResult: AlertResult): void {
    if (typeof window === 'undefined') return

    try {
        const stored = localStorage.getItem(ALERT_HISTORY_KEY)
        const history: { [patientId: string]: HistoricalScore[] } = stored ? JSON.parse(stored) : {}

        if (!history[patientId]) {
            history[patientId] = []
        }

        history[patientId].push({
            date: alertResult.timestamp.split('T')[0],
            score: alertResult.finalScore,
            level: alertResult.level
        })

        // Keep only last 30 days
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        history[patientId] = history[patientId].filter(entry =>
            new Date(entry.date) >= thirtyDaysAgo
        )

        localStorage.setItem(ALERT_HISTORY_KEY, JSON.stringify(history))
    } catch (error) {
        console.error('Error storing alert history:', error)
    }
}

// Get alert history
export function getAlertHistory(patientId: string): HistoricalScore[] {
    if (typeof window === 'undefined') return []

    try {
        const stored = localStorage.getItem(ALERT_HISTORY_KEY)
        const history: { [patientId: string]: HistoricalScore[] } = stored ? JSON.parse(stored) : {}
        return history[patientId] || []
    } catch (error) {
        console.error('Error getting alert history:', error)
        return []
    }
}

// Calculate 3-day weighted moving average
export function calculateWeightedScore(patientId: string, todayScore: number): number {
    const history = getAlertHistory(patientId)

    if (history.length === 0) {
        return todayScore
    }

    // Get last 2 days (excluding today)
    const sortedHistory = history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    const yesterday = sortedHistory[0]?.score || todayScore
    const dayBefore = sortedHistory[1]?.score || todayScore

    // Weighted average: Today × 0.5 + Yesterday × 0.3 + DayBefore × 0.2
    const finalScore = (todayScore * 0.5) + (yesterday * 0.3) + (dayBefore * 0.2)

    return Math.round(finalScore * 10) / 10 // Round to 1 decimal place
}

// ILD Alert System
export function calculateILDAlert(logData: PatientLogData): AlertResult {
    const triggers: string[] = []
    const recommendations: string[] = []
    let score = 0

    // RED ALERT - Immediate Triggers
    let isRedAlert = false

    // Immediate Triggers
    if (logData.hemoptysis) {
        isRedAlert = true
        triggers.push('Hemoptysis (Blood in sputum) detected')
        recommendations.push('Seek immediate medical attention')
    }

    if (logData.chestPain > 8) {
        isRedAlert = true
        triggers.push('Severe chest pain (VAS > 8)')
        recommendations.push('Emergency medical evaluation required')
    }

    if (logData.fever > 8 && logData.cough > 8) {
        isRedAlert = true
        triggers.push('High fever (VAS > 8) with new cough (VAS > 8)')
        recommendations.push('Immediate medical assessment for possible infection')
    }

    // Vitals Gate
    if (logData.spo2AtRest < 88) {
        isRedAlert = true
        triggers.push('SpO₂ at rest < 88%')
        recommendations.push('Oxygen therapy may be required - contact doctor immediately')
    }

    if (logData.oxygenRequirement && logData.baselineOxygen &&
        (logData.oxygenRequirement - logData.baselineOxygen) >= 3) {
        isRedAlert = true
        triggers.push('Oxygen requirement increased ≥ 3 L/min from baseline')
        recommendations.push('Urgent medical evaluation for respiratory deterioration')
    }

    if (logData.baselineSpO2 && logData.spo2OnExertion &&
        (logData.baselineSpO2 - logData.spo2OnExertion) > 10) {
        isRedAlert = true
        triggers.push('SpO₂ drop on exertion > 10% from baseline')
        recommendations.push('Exercise restriction and medical consultation required')
    }

    if (logData.mMRCScale >= 3 ||
        (logData.baselinemMRC && (logData.mMRCScale - logData.baselinemMRC) >= 2)) {
        isRedAlert = true
        triggers.push('mMRC grade ≥ 3 or increase of +2 from baseline')
        recommendations.push('Significant breathlessness - immediate medical attention')
    }

    // Symptom Gate
    const highSymptoms = []
    if (logData.breathlessness > 8) highSymptoms.push('Breathlessness')
    if (logData.dryCough && logData.dryCough > 8) highSymptoms.push('Dry Cough')
    if (logData.pedalEdema > 8) highSymptoms.push('Pedal Edema')
    if (logData.fever > 8) highSymptoms.push('Fever')
    if (logData.wheezing > 8) highSymptoms.push('Wheezing')

    if (highSymptoms.length > 0) {
        isRedAlert = true
        triggers.push(`Severe symptoms (VAS > 8): ${highSymptoms.join(', ')}`)
        recommendations.push('Multiple severe symptoms require immediate medical evaluation')
    }

    if (isRedAlert) {
        const finalScore = calculateWeightedScore(logData.patientId, 10)
        const result: AlertResult = {
            level: 'RED',
            score: 10,
            finalScore,
            triggers,
            recommendations,
            timestamp: new Date().toISOString(),
            patientId: logData.patientId,
            diseaseType: logData.diseaseType
        }
        storeAlertHistory(logData.patientId, result)
        return result
    }

    // YELLOW ALERT - Weighted Score System

    // SpO₂ 89-91%
    if (logData.spo2AtRest >= 89 && logData.spo2AtRest <= 91) {
        score += 3
        triggers.push('SpO₂ at rest 89-91%')
        recommendations.push('Monitor oxygen saturation closely')
    }

    // mMRC increase of +1
    if (logData.baselinemMRC && (logData.mMRCScale - logData.baselinemMRC) === 1) {
        score += 2
        triggers.push('mMRC increased by 1 from baseline')
        recommendations.push('Breathlessness worsening - consider medication review')
    }

    // Symptoms VAS 5-7
    const moderateSymptoms = []
    if (logData.breathlessness >= 5 && logData.breathlessness <= 7) moderateSymptoms.push('Breathlessness')
    if (logData.cough >= 5 && logData.cough <= 7) moderateSymptoms.push('Cough')
    if (logData.fatigue && logData.fatigue >= 5 && logData.fatigue <= 7) moderateSymptoms.push('Fatigue')

    if (moderateSymptoms.length > 0) {
        score += 2
        triggers.push(`Moderate symptoms (VAS 5-7): ${moderateSymptoms.join(', ')}`)
        recommendations.push('Symptom monitoring and possible medication adjustment')
    }

    // KBILD score drop >10%
    if (logData.kbildScore && logData.baselineKBILD &&
        ((logData.baselineKBILD - logData.kbildScore) / logData.baselineKBILD) > 0.1) {
        score += 3
        triggers.push('KBILD score dropped >10% from baseline')
        recommendations.push('Quality of life declining - comprehensive review needed')
    }

    // Anti-fibrotics not taken
    if (logData.antiFibroticsTaken === false) {
        score += 1
        triggers.push('Anti-fibrotic medication not taken')
        recommendations.push('Ensure medication compliance for disease progression control')
    }

    // Side effects
    if (logData.newRash || logData.severeDiarrhea) {
        score += 2
        const sideEffects = []
        if (logData.newRash) sideEffects.push('new rash')
        if (logData.severeDiarrhea) sideEffects.push('severe diarrhea')
        triggers.push(`Medication side effects: ${sideEffects.join(', ')}`)
        recommendations.push('Contact doctor regarding medication side effects')
    }

    // Calculate final weighted score
    const finalScore = calculateWeightedScore(logData.patientId, score)

    // Determine alert level
    let level: AlertLevel = 'GREEN'

    if (finalScore > 3) {
        level = 'YELLOW'
    }

    // GREEN ALERT conditions
    if (level === 'GREEN') {
        if (logData.spo2AtRest >= 92) {
            recommendations.push('Oxygen saturation is stable')
        }
        if (logData.breathlessness < 4) {
            recommendations.push('Symptom control is good')
        }
        if (logData.breathlessnessComparison === 'better' || logData.breathlessnessComparison === 'same') {
            recommendations.push('Breathlessness stable or improving')
        }
        if (triggers.length === 0) {
            triggers.push('All parameters within acceptable range')
            recommendations.push('Continue current treatment plan')
        }
    }

    const result: AlertResult = {
        level,
        score,
        finalScore,
        triggers,
        recommendations,
        timestamp: new Date().toISOString(),
        patientId: logData.patientId,
        diseaseType: logData.diseaseType
    }

    storeAlertHistory(logData.patientId, result)
    return result
}

// Store and retrieve patient baselines
export function storePatientBaseline(patientId: string, baseline: Partial<PatientLogData>): void {
    if (typeof window === 'undefined') return

    try {
        const stored = localStorage.getItem(PATIENT_BASELINES_KEY)
        const baselines: { [patientId: string]: Partial<PatientLogData> } = stored ? JSON.parse(stored) : {}

        baselines[patientId] = { ...baselines[patientId], ...baseline }
        localStorage.setItem(PATIENT_BASELINES_KEY, JSON.stringify(baselines))
    } catch (error) {
        console.error('Error storing patient baseline:', error)
    }
}

export function getPatientBaseline(patientId: string): Partial<PatientLogData> | null {
    if (typeof window === 'undefined') return null

    try {
        const stored = localStorage.getItem(PATIENT_BASELINES_KEY)
        const baselines: { [patientId: string]: Partial<PatientLogData> } = stored ? JSON.parse(stored) : {}
        return baselines[patientId] || null
    } catch (error) {
        console.error('Error getting patient baseline:', error)
        return null
    }
}

// Initialize baseline from patient data
export function initializePatientBaseline(patientId: string, patientData: PatientData): void {
    const baseline: Partial<PatientLogData> = {
        baselineSpO2: 98, // Default, should be set from initial assessment
        baselinemMRC: 0,  // Default, should be set from initial assessment
        baselineOxygen: 0, // Room air
        baselineKBILD: 100 // Default good quality of life score
    }

    // Set baseline oxygen from respiratory support data
    if (patientData.ltot?.enabled && patientData.ltot.oxygenLitres) {
        baseline.baselineOxygen = parseFloat(patientData.ltot.oxygenLitres)
    }

    storePatientBaseline(patientId, baseline)
}

// Get alert color for UI
export function getAlertColor(level: AlertLevel): string {
    switch (level) {
        case 'RED': return '#dc2626'
        case 'YELLOW': return '#d97706'
        case 'GREEN': return '#16a34a'
        default: return '#6b7280'
    }
}

// Asthma Alert System - Updated to match exact specifications
export function calculateAsthmaAlert(logData: PatientLogData): AlertResult {
    const triggers: string[] = []
    const recommendations: string[] = []
    let score = 0

    // Store control and inhaler history for consecutive day tracking
    if (logData.controlLevel && logData.rescueInhalerPuffs !== undefined) {
        storeAsthmaControlHistory(logData.patientId, logData.controlLevel, logData.rescueInhalerPuffs)
    }

    // RED ALERT - Immediate Triggers
    let isRedAlert = false

    // 1. Hemoptysis = Yes
    if (logData.hemoptysis) {
        isRedAlert = true
        triggers.push('Hemoptysis (Blood in sputum) detected')
        recommendations.push('Seek immediate medical attention')
    }

    // 2. Severe chest pain (VAS > 8)
    if (logData.chestPain > 8) {
        isRedAlert = true
        triggers.push('Severe chest pain (VAS > 8)')
        recommendations.push('Emergency medical evaluation required')
    }

    // 3. Fever (VAS > 8) + New cough (VAS > 8)
    if (logData.fever > 8 && logData.cough > 8) {
        isRedAlert = true
        triggers.push('High fever (VAS > 8) with severe cough (VAS > 8)')
        recommendations.push('Immediate medical assessment for possible infection')
    }

    // 4. Poorly controlled asthma for ≥ 2 consecutive days
    if (hasConsecutivePoorControl(logData.patientId, 2)) {
        isRedAlert = true
        triggers.push('Poorly controlled asthma for ≥ 2 consecutive days')
        recommendations.push('Urgent medical review - asthma control deteriorating')
    }

    // 5. Rescue inhaler: 4 puffs/day for >2 days OR >6 puffs in a single day
    const inhalerPattern = checkRescueInhalerPattern(logData.patientId)
    if (inhalerPattern.moreThan4For2Days) {
        isRedAlert = true
        triggers.push('Rescue inhaler >4 puffs/day for >2 consecutive days')
        recommendations.push('Excessive rescue medication use - immediate medical attention required')
    }
    if (inhalerPattern.moreThan6Today) {
        isRedAlert = true
        triggers.push('Rescue inhaler >6 puffs in a single day')
        recommendations.push('Severe asthma exacerbation - seek emergency care immediately')
    }

    // 6. SpO₂ < 88% for >3 hours or oxygen increase ≥ 3L
    if (logData.spo2AtRest < 88) {
        isRedAlert = true
        triggers.push('SpO₂ < 88% for >3 hours')
        recommendations.push('Critical oxygen saturation - emergency medical care required')
    }

    if (logData.oxygenRequirement && logData.baselineOxygen &&
        (logData.oxygenRequirement - logData.baselineOxygen) >= 3) {
        isRedAlert = true
        triggers.push('Oxygen requirement increased ≥ 3L from baseline')
        recommendations.push('Urgent medical evaluation for respiratory failure')
    }

    // 7. SpO₂ drop on exertion >10%
    if (logData.baselineSpO2 && logData.spo2OnExertion &&
        (logData.baselineSpO2 - logData.spo2OnExertion) > 10) {
        isRedAlert = true
        triggers.push('SpO₂ drop on exertion >10% from baseline')
        recommendations.push('Severe exercise intolerance - immediate medical consultation')
    }

    // 8. mMRC ≥ 3 or increase of +2
    if (logData.mMRCScale >= 3) {
        isRedAlert = true
        triggers.push('mMRC breathlessness scale ≥ 3')
        recommendations.push('Severe breathlessness - immediate medical attention required')
    }

    if (logData.baselinemMRC && (logData.mMRCScale - logData.baselinemMRC) >= 2) {
        isRedAlert = true
        triggers.push('mMRC increased by +2 from baseline')
        recommendations.push('Significant worsening of breathlessness - urgent medical review')
    }

    if (isRedAlert) {
        const finalScore = calculateWeightedScore(logData.patientId, 10)
        const result: AlertResult = {
            level: 'RED',
            score: 10,
            finalScore,
            triggers,
            recommendations,
            timestamp: new Date().toISOString(),
            patientId: logData.patientId,
            diseaseType: logData.diseaseType
        }
        storeAlertHistory(logData.patientId, result)
        return result
    }

    // YELLOW ALERT - Weighted Score System

    // 1. SpO₂ 89–91%
    if (logData.spo2AtRest >= 89 && logData.spo2AtRest <= 91) {
        score += 3
        triggers.push('SpO₂ 89-91% - monitor closely')
        recommendations.push('Oxygen saturation borderline - monitor and consider medical review')
    }

    // 2. mMRC +1
    if (logData.baselinemMRC && (logData.mMRCScale - logData.baselinemMRC) === 1) {
        score += 2
        triggers.push('mMRC increased by +1 from baseline')
        recommendations.push('Breathlessness worsening - consider medication adjustment')
    }

    // 3. Any symptom VAS 5–7
    const moderateSymptoms = []
    if (logData.breathlessness >= 5 && logData.breathlessness <= 7) moderateSymptoms.push('Breathlessness')
    if (logData.cough >= 5 && logData.cough <= 7) moderateSymptoms.push('Cough')
    if (logData.wheezing >= 5 && logData.wheezing <= 7) moderateSymptoms.push('Wheezing')
    if (logData.chestPain >= 5 && logData.chestPain <= 7) moderateSymptoms.push('Chest Pain')
    if (logData.fever >= 5 && logData.fever <= 7) moderateSymptoms.push('Fever')

    if (moderateSymptoms.length > 0) {
        score += 2
        triggers.push(`Moderate symptoms (VAS 5-7): ${moderateSymptoms.join(', ')}`)
        recommendations.push('Moderate symptoms present - monitor and consider treatment adjustment')
    }

    // 4. Rescue inhaler >4 in one day
    if (logData.rescueInhalerPuffs && logData.rescueInhalerPuffs > 4) {
        score += 2
        triggers.push('Rescue inhaler >4 puffs in one day')
        recommendations.push('Increased rescue medication use indicates declining control')
    }

    // 5. Partly controlled asthma OR poorly controlled for 1 day
    if (logData.controlLevel === 'partly-controlled') {
        score += 2
        triggers.push('Asthma partly controlled')
        recommendations.push('Asthma control suboptimal - review treatment plan')
    }

    if (logData.controlLevel === 'poorly-controlled' && !hasConsecutivePoorControl(logData.patientId, 2)) {
        score += 3
        triggers.push('Asthma poorly controlled (1 day)')
        recommendations.push('Poor asthma control - urgent medical review recommended')
    }

    // 6. Inhalers marked "Not Taken"
    if (logData.inhalersTaken === false) {
        score += 2
        triggers.push('Controller inhalers not taken')
        recommendations.push('Medication non-compliance detected - ensure regular inhaler use')
    }

    // 7. Any reported side effect
    if (logData.hasSideEffects) {
        score += 1
        triggers.push('Medication side effects reported')
        recommendations.push('Discuss side effects with healthcare provider')
    }

    // Calculate final weighted score
    const finalScore = calculateWeightedScore(logData.patientId, score)

    // Determine alert level
    let level: AlertLevel = 'GREEN'

    if (finalScore > 0) {
        level = 'YELLOW'
    }

    // GREEN ALERT conditions - override if all conditions are met
    const isGreenAlert = (
        logData.spo2AtRest > 91 &&
        logData.breathlessness <= 4 &&
        logData.cough <= 4 &&
        logData.wheezing <= 4 &&
        logData.chestPain <= 4 &&
        logData.fever <= 4 &&
        (logData.rescueInhalerPuffs || 0) < 3 &&
        logData.controlLevel === 'well-controlled'
    )

    if (isGreenAlert) {
        level = 'GREEN'
        triggers.length = 0 // Clear any triggers
        triggers.push('All asthma parameters within optimal range')
        recommendations.length = 0 // Clear any recommendations
        recommendations.push('Excellent asthma control - continue current treatment plan')
        recommendations.push('SpO₂ >91% - oxygen saturation excellent')
        recommendations.push('Symptoms well controlled (VAS 0-4)')
        recommendations.push('Rescue inhaler use minimal (<3 puffs/day)')
        recommendations.push('Asthma well controlled')
    }

    const result: AlertResult = {
        level,
        score,
        finalScore,
        triggers,
        recommendations,
        timestamp: new Date().toISOString(),
        patientId: logData.patientId,
        diseaseType: logData.diseaseType
    }

    storeAlertHistory(logData.patientId, result)
    return result
}

// COPD Alert System - Point-based scoring with cumulative scoring and UI status mapping
export function calculateCOPDAlert(logData: PatientLogData): AlertResult {
    const triggers: string[] = []
    const recommendations: string[] = []
    let score = 0

    // COPD SCORING METRICS

    // Specific - Sputum Color
    if (logData.sputumColor === 'yellow' || logData.sputumColor === 'dark-green') {
        score += 4
        triggers.push(`Purulent sputum (${logData.sputumColor})`)
        recommendations.push('Purulent sputum may indicate bacterial infection - consider antibiotic treatment')
    }

    // Specific - Sputum Volume
    if (logData.sputumVolume === 'large') {
        score += 2
        triggers.push('Large amount of sputum production')
        recommendations.push('Increased sputum production - ensure adequate airway clearance')
    }

    // Specific - Energy Level
    if (logData.energyLevel && logData.energyLevel < 4) {
        score += 2
        triggers.push('Low energy level (<4/10)')
        recommendations.push('Reduced energy levels - consider rest and energy conservation techniques')
    }

    // Specific - Chest Heaviness
    if (logData.chestHeaviness && logData.chestHeaviness > 7) {
        score += 2
        triggers.push('Severe chest heaviness (>7/10)')
        recommendations.push('Significant chest discomfort - bronchodilator therapy may help')
    }

    // Specific - Sleep
    if (logData.sleepDisturbed) {
        score += 2
        triggers.push('Sleep disturbed due to breathing')
        recommendations.push('Sleep disturbance indicates poor symptom control - review treatment plan')
    }

    // Specific - Fever
    if (logData.fever && logData.fever > 8) { // VAS > 8 approximates >102°F twice/day
        score += 3
        triggers.push('High fever (>102°F)')
        recommendations.push('High fever with respiratory symptoms - urgent medical evaluation needed')
    }

    // Common - Wheezing
    if (logData.wheezing > 0) {
        score += 2
        triggers.push('Wheezing present')
        recommendations.push('Wheezing indicates airway obstruction - bronchodilator therapy recommended')
    }

    // Vitals - mMRC increase
    if (logData.baselinemMRC && (logData.mMRCScale - logData.baselinemMRC) >= 1) {
        score += 2
        triggers.push(`mMRC increased by +${logData.mMRCScale - logData.baselinemMRC} from baseline`)
        recommendations.push('Worsening breathlessness - review treatment and consider escalation')
    }

    // Vitals - SpO₂
    if (logData.spo2AtRest < 88 ||
        (logData.oxygenRequirement && logData.baselineOxygen &&
            (logData.oxygenRequirement - logData.baselineOxygen) >= 3)) {
        score += 4
        triggers.push('Critical oxygen levels (SpO₂ <88% or oxygen increase ≥3L)')
        recommendations.push('Critical respiratory status - immediate medical attention required')
    }

    // Critical - Hemoptysis
    if (logData.hemoptysis) {
        score += 4
        triggers.push('Hemoptysis (blood in sputum) >1 cup')
        recommendations.push('Significant hemoptysis - urgent medical evaluation required')
    }

    // Critical - Chest Pain
    if (logData.chestPain > 8) {
        score += 4
        triggers.push('Severe chest pain')
        recommendations.push('Severe chest pain requires immediate medical assessment')
    }

    // Stability - Exercise tolerance
    if (logData.exerciseTolerance === true) {
        score -= 1
        triggers.push('Good exercise tolerance today')
        recommendations.push('Maintaining good exercise tolerance - continue current activity level')
    }

    // Calculate final weighted score
    const finalScore = calculateWeightedScore(logData.patientId, score)

    // ALERT CLASSIFICATION
    let level: AlertLevel = 'GREEN'
    let dashboardMessage = ''

    if (finalScore >= 1 && finalScore <= 3) {
        level = 'GREEN'
        dashboardMessage = 'Symptoms within normal range'
        if (triggers.length === 0) {
            triggers.push('All COPD parameters within acceptable range')
            recommendations.push('Continue current treatment plan and airway clearance')
        }
    } else if (finalScore >= 4 && finalScore <= 7) {
        level = 'YELLOW'
        dashboardMessage = 'Slight worsening, increase rest'
        recommendations.unshift('Slight worsening detected - increase rest and monitor closely')
    } else if (finalScore > 7) {
        level = 'RED'
        dashboardMessage = 'Urgent: contact doctor or hospital'
        recommendations.unshift('Urgent medical attention required - contact doctor or hospital immediately')
    }

    // Add dashboard message to triggers
    if (dashboardMessage) {
        triggers.unshift(`COPD Status: ${dashboardMessage}`)
    }

    const result: AlertResult = {
        level,
        score,
        finalScore,
        triggers,
        recommendations,
        timestamp: new Date().toISOString(),
        patientId: logData.patientId,
        diseaseType: logData.diseaseType
    }

    storeAlertHistory(logData.patientId, result)
    return result
}

// Bronchiectasis & Post-ICU Recovery Alert System - Shared infection-focused risk scoring
export function calculateBronchiectasisPostICUAlert(logData: PatientLogData): AlertResult {
    const triggers: string[] = []
    const recommendations: string[] = []
    let score = 0

    // SCORING METRICS

    // Specific - Sputum Color
    if (logData.sputumColor === 'dark-green') {
        score += 5
        triggers.push('Dark green sputum (purulent)')
        recommendations.push('Purulent sputum indicates bacterial infection - antibiotic treatment likely needed')
    } else if (logData.sputumColor === 'pale-yellow' || logData.sputumColor === 'yellow') {
        score += 3
        triggers.push('Pale yellow/light green sputum')
        recommendations.push('Sputum color change - monitor for infection signs')
    }

    // Specific - Sputum Volume
    if (logData.sputumVolume === 'large') {
        score += 3
        triggers.push('Much more sputum than usual')
        recommendations.push('Increased sputum production - enhance airway clearance techniques')
    }

    // Systemic - Fever
    if (logData.fever && logData.fever > 8) { // VAS > 8 approximates >102°F
        score += 4
        triggers.push('High fever (>102°F)')
        recommendations.push('High fever indicates systemic infection - urgent medical evaluation required')
    }

    // Systemic - Malaise
    if (logData.malaise === true || (logData.fatigue && logData.fatigue > 8)) {
        score += 2
        triggers.push('Extreme fatigue/malaise')
        recommendations.push('Severe fatigue may indicate systemic illness - rest and medical review needed')
    }

    // Common - Pedal Edema
    if (logData.pedalEdema > 0) {
        score += 3
        triggers.push('Pedal edema present')
        recommendations.push('Fluid retention detected - may indicate cardiac involvement or severe infection')
    }

    // Common - Wheezing
    if (logData.wheezing > 0) {
        score += 2
        triggers.push('Wheezing present')
        recommendations.push('Airway obstruction - bronchodilator therapy may help')
    }

    // Common - mMRC increase
    if (logData.baselinemMRC && (logData.mMRCScale - logData.baselinemMRC) >= 1) {
        score += 2
        triggers.push(`mMRC increased by +${logData.mMRCScale - logData.baselinemMRC} from baseline`)
        recommendations.push('Worsening breathlessness - review treatment plan')
    }

    // Critical - Hemoptysis
    if (logData.hemoptysis) {
        score += 4
        triggers.push('Hemoptysis (blood in sputum) >1 cup')
        recommendations.push('Significant hemoptysis - immediate medical attention required')
    }

    // Critical - Chest Pain
    if (logData.chestPain > 8) {
        score += 4
        triggers.push('Severe chest pain')
        recommendations.push('Severe chest pain requires emergency evaluation')
    }

    // Vitals - SpO₂
    if (logData.spo2AtRest < 88 ||
        (logData.oxygenRequirement && logData.baselineOxygen &&
            (logData.oxygenRequirement - logData.baselineOxygen) >= 3)) {
        score += 4
        triggers.push('Critical oxygen levels (SpO₂ <88% or oxygen increase ≥3L)')
        recommendations.push('Critical respiratory failure - immediate medical intervention required')
    }

    // Calculate final weighted score
    const finalScore = calculateWeightedScore(logData.patientId, score)

    // ALERT STATUS MAPPING
    let level: AlertLevel = 'GREEN'
    let clinicalAction = ''

    if (finalScore >= 1 && finalScore <= 3) {
        level = 'GREEN'
        clinicalAction = 'Continue airway clearance'
        if (triggers.length === 0) {
            triggers.push('All parameters within acceptable range')
            recommendations.push('Continue current airway clearance routine and medications')
        }
    } else if (finalScore >= 4 && finalScore <= 7) {
        level = 'YELLOW'
        clinicalAction = 'Increase clearance, monitor fever'
        recommendations.unshift('Increase airway clearance frequency and monitor for fever')
    } else if (finalScore >= 8 && finalScore <= 10) {
        level = 'RED'
        clinicalAction = 'Infection suspected, contact doctor'
        recommendations.unshift('Infection suspected - contact doctor immediately for evaluation and possible antibiotic treatment')
    } else if (finalScore > 10) {
        level = 'RED'
        clinicalAction = 'Critical infection, emergency care needed'
        recommendations.unshift('Critical infection signs - seek emergency medical care immediately')
    }

    // Add clinical action to triggers
    if (clinicalAction) {
        triggers.unshift(`Clinical Action: ${clinicalAction}`)
    }

    const result: AlertResult = {
        level,
        score,
        finalScore,
        triggers,
        recommendations,
        timestamp: new Date().toISOString(),
        patientId: logData.patientId,
        diseaseType: logData.diseaseType
    }

    storeAlertHistory(logData.patientId, result)
    return result
}

// Main alert calculation function that routes to disease-specific logic
export function calculateAlert(logData: PatientLogData): AlertResult {
    switch (logData.diseaseType) {
        case 'ILD':
            return calculateILDAlert(logData)
        case 'ASTHMA':
            return calculateAsthmaAlert(logData)
        case 'COPD':
            return calculateCOPDAlert(logData)
        case 'BRONCHIECTASIS':
        case 'POST_ICU':
            return calculateBronchiectasisPostICUAlert(logData)
        default:
            // Default generic alert logic
            return calculateILDAlert(logData) // Use ILD as fallback for now
    }
}

// Get alert background color for UI
export function getAlertBackgroundColor(level: AlertLevel): string {
    switch (level) {
        case 'RED': return '#fee2e2'
        case 'YELLOW': return '#fef3c7'
        case 'GREEN': return '#dcfce7'
        default: return '#f3f4f6'
    }
}