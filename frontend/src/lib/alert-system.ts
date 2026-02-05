// Alert & Notification System
import { Alert, DiseaseType, CommonPatientData, AsthmaData, COPDData, BronchiectasisData, ILDData, PostInfectionData } from './monitoring-types'
import { calculateRedFlagScore } from './red-flag-scoring'
import { updatePatientFolderStatus } from './doctor-patient-mapping'

const ALERTS_STORAGE_KEY = 'patient_alerts'

// Create alert based on patient data and red flag score
export function createAlert(
    patientId: string,
    doctorId: string,
    diseaseType: DiseaseType,
    redFlagScore: number,
    factors: string[],
    message: string
): Alert {
    const alert: Alert = {
        id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        patientId,
        doctorId,
        type: redFlagScore >= 9 ? 'critical' : redFlagScore >= 7 ? 'high-risk' : 'pending-review',
        message,
        factors,
        redFlagScore,
        createdAt: new Date().toISOString(),
        acknowledged: false,
        diseaseType
    }

    // Store alert
    storeAlert(alert)

    // Update patient folder status
    const alertCount = getPatientAlerts(patientId).filter(a => !a.acknowledged).length
    updatePatientFolderStatus(patientId, redFlagScore, alertCount)

    return alert
}

// Store alert in localStorage
function storeAlert(alert: Alert): void {
    if (typeof window === 'undefined') return

    try {
        const stored = localStorage.getItem(ALERTS_STORAGE_KEY)
        const alerts: Alert[] = stored ? JSON.parse(stored) : []
        alerts.push(alert)
        localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts))
    } catch (error) {
        console.error('Error storing alert:', error)
    }
}

// Get all alerts for a patient
export function getPatientAlerts(patientId: string): Alert[] {
    if (typeof window === 'undefined') return []

    try {
        const stored = localStorage.getItem(ALERTS_STORAGE_KEY)
        const alerts: Alert[] = stored ? JSON.parse(stored) : []
        return alerts.filter(alert => alert.patientId === patientId)
    } catch (error) {
        console.error('Error getting patient alerts:', error)
        return []
    }
}

// Get all alerts for a doctor
export function getDoctorAlerts(doctorId: string): Alert[] {
    if (typeof window === 'undefined') return []

    try {
        const stored = localStorage.getItem(ALERTS_STORAGE_KEY)
        const alerts: Alert[] = stored ? JSON.parse(stored) : []
        return alerts.filter(alert => alert.doctorId === doctorId)
    } catch (error) {
        console.error('Error getting doctor alerts:', error)
        return []
    }
}

// Acknowledge an alert
export function acknowledgeAlert(alertId: string): void {
    if (typeof window === 'undefined') return

    try {
        const stored = localStorage.getItem(ALERTS_STORAGE_KEY)
        const alerts: Alert[] = stored ? JSON.parse(stored) : []

        const alertIndex = alerts.findIndex(alert => alert.id === alertId)
        if (alertIndex >= 0) {
            alerts[alertIndex].acknowledged = true
            localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts))

            // Update patient folder alert count
            const alert = alerts[alertIndex]
            const activeAlerts = alerts.filter(a =>
                a.patientId === alert.patientId && !a.acknowledged
            ).length
            updatePatientFolderStatus(alert.patientId, alert.redFlagScore || 0, activeAlerts)
        }
    } catch (error) {
        console.error('Error acknowledging alert:', error)
    }
}

// Process patient data and create alerts if needed
export function processPatientDataForAlerts(
    patientId: string,
    doctorId: string,
    diseaseType: DiseaseType,
    commonData: CommonPatientData,
    diseaseSpecificData: AsthmaData | COPDData | BronchiectasisData | ILDData | PostInfectionData
): Alert | null {
    // Calculate red flag score
    const scoringData = {
        patientId,
        diagnosis: diseaseType,
        spo2: commonData.spo2.atRest,
        spo2BaselineDrop: diseaseType === 'ILD' ? (diseaseSpecificData as ILDData).spo2BaselineDrop : undefined,
        respiratoryRate: 20, // Default - would come from actual data
        hasHemoptysis: diseaseType === 'Bronchiectasis' || diseaseType === 'Post-Infection'
            ? (diseaseSpecificData as BronchiectasisData).hasHemoptysis
            : false,
        mMRCIncrease: commonData.mMRCScale > 2, // Assuming baseline of 2
        medCompliance: true, // Would come from medication tracking
        vasSymptomScore: Math.max(...commonData.symptoms.map(s => s.score)),
        aqi: commonData.aqi.value,
        diseaseData: diseaseSpecificData
    }

    const redFlagResult = calculateRedFlagScore(scoringData)

    // Create alert if score is high enough
    if (redFlagResult.score >= 4) {
        const message = generateAlertMessage(diseaseType, redFlagResult.score, redFlagResult.factors)

        return createAlert(
            patientId,
            doctorId,
            diseaseType,
            redFlagResult.score,
            redFlagResult.factors,
            message
        )
    }

    return null
}

// Generate alert message based on disease type and factors
function generateAlertMessage(diseaseType: DiseaseType, score: number, factors: string[]): string {
    const severity = score >= 9 ? 'Critical' : score >= 7 ? 'High Risk' : 'Moderate Risk'

    let baseMessage = `${severity} alert for ${diseaseType} patient. `

    if (score >= 9) {
        baseMessage += 'Immediate medical attention required. '
    } else if (score >= 7) {
        baseMessage += 'Doctor notification and review needed. '
    } else {
        baseMessage += 'Monitor closely and consider intervention. '
    }

    // Add specific factors
    if (factors.length > 0) {
        baseMessage += `Key concerns: ${factors.slice(0, 3).join(', ')}.`
    }

    return baseMessage
}

// Check for specific alert conditions
export function checkSpecificAlertConditions(
    patientId: string,
    doctorId: string,
    diseaseType: DiseaseType,
    commonData: CommonPatientData,
    diseaseSpecificData: any
): Alert[] {
    const alerts: Alert[] = []

    // AQI Alert
    if (commonData.aqi.value > 200) {
        alerts.push(createAlert(
            patientId,
            doctorId,
            diseaseType,
            5, // Moderate risk
            ['Poor air quality (AQI >200)'],
            `Air quality alert: AQI is ${commonData.aqi.value}. Recommend staying indoors and using air purifiers.`
        ))
    }

    // Oxygen escalation alert (from common dashboard)
    if (commonData.conditionStatus.hasWorsening && commonData.conditionStatus.oxygenChange > 4) {
        alerts.push(createAlert(
            patientId,
            doctorId,
            diseaseType,
            8, // High risk
            ['Oxygen requirement increased >4L'],
            'Critical: Oxygen requirement increased by more than 4 litres. Immediate medical evaluation required.'
        ))
    }

    // Disease-specific alerts
    switch (diseaseType) {
        case 'Asthma':
            const asthmaData = diseaseSpecificData as AsthmaData
            if (asthmaData.peakFlowPercent && asthmaData.peakFlowPercent < 60) {
                alerts.push(createAlert(
                    patientId,
                    doctorId,
                    diseaseType,
                    9, // Critical
                    ['Peak flow <60% of personal best'],
                    'Critical asthma alert: Peak flow below 60% of personal best. Seek immediate medical attention.'
                ))
            }
            if (asthmaData.rescueInhalerPuffs > 4) {
                alerts.push(createAlert(
                    patientId,
                    doctorId,
                    diseaseType,
                    7, // High risk
                    ['Excessive rescue inhaler use (>4 puffs/day)'],
                    'Asthma control alert: Excessive rescue inhaler use indicates poor control. Review treatment plan.'
                ))
            }
            break

        case 'COPD':
            const copdData = diseaseSpecificData as COPDData
            if (copdData.fever && (copdData.sputumColor === 'dark-green' || copdData.sputumColor === 'yellow')) {
                alerts.push(createAlert(
                    patientId,
                    doctorId,
                    diseaseType,
                    8, // High risk
                    ['Fever with purulent sputum'],
                    'COPD exacerbation alert: Fever with purulent sputum suggests bacterial infection. Antibiotic treatment may be needed.'
                ))
            }
            break

        case 'ILD':
            const ildData = diseaseSpecificData as ILDData
            if (ildData.spo2BaselineDrop >= 4) {
                alerts.push(createAlert(
                    patientId,
                    doctorId,
                    diseaseType,
                    9, // Critical
                    ['SpO2 drop ≥4% from baseline'],
                    'Critical ILD alert: Significant SpO2 drop from baseline. Immediate evaluation for disease progression required.'
                ))
            }
            if (ildData.newChestPain) {
                alerts.push(createAlert(
                    patientId,
                    doctorId,
                    diseaseType,
                    8, // High risk
                    ['New chest pain'],
                    'ILD alert: New chest pain requires evaluation to rule out complications such as pneumothorax.'
                ))
            }
            break

        case 'Bronchiectasis':
        case 'Post-Infection':
            const bronchData = diseaseSpecificData as BronchiectasisData
            if (bronchData.hasHemoptysis) {
                alerts.push(createAlert(
                    patientId,
                    doctorId,
                    diseaseType,
                    10, // Critical
                    ['Hemoptysis (blood in sputum)'],
                    'Critical alert: Blood in sputum requires immediate medical evaluation to rule out serious complications.'
                ))
            }
            if (bronchData.fever && bronchData.sputumColor === 'dark-green') {
                alerts.push(createAlert(
                    patientId,
                    doctorId,
                    diseaseType,
                    7, // High risk
                    ['Fever with green sputum'],
                    'Infection alert: Fever with green sputum suggests bacterial infection. Consider antibiotic treatment.'
                ))
            }
            break
    }

    return alerts
}

// Get alert statistics for dashboard
export function getAlertStatistics(doctorId: string): {
    total: number
    critical: number
    highRisk: number
    pendingReview: number
    acknowledged: number
} {
    const alerts = getDoctorAlerts(doctorId)

    return {
        total: alerts.length,
        critical: alerts.filter(a => a.type === 'critical' && !a.acknowledged).length,
        highRisk: alerts.filter(a => a.type === 'high-risk' && !a.acknowledged).length,
        pendingReview: alerts.filter(a => a.type === 'pending-review' && !a.acknowledged).length,
        acknowledged: alerts.filter(a => a.acknowledged).length
    }
}

// Clean up old alerts (older than 30 days)
export function cleanupOldAlerts(): void {
    if (typeof window === 'undefined') return

    try {
        const stored = localStorage.getItem(ALERTS_STORAGE_KEY)
        const alerts: Alert[] = stored ? JSON.parse(stored) : []

        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const recentAlerts = alerts.filter(alert =>
            new Date(alert.createdAt || new Date()) > thirtyDaysAgo
        )

        localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(recentAlerts))
    } catch (error) {
        console.error('Error cleaning up old alerts:', error)
    }
}

// Initialize demo alerts for testing
export function initializeDemoAlerts(): void {
    if (typeof window === 'undefined') return

    try {
        const stored = localStorage.getItem(ALERTS_STORAGE_KEY)
        const alerts: Alert[] = stored ? JSON.parse(stored) : []

        // Only create demo alerts if none exist
        if (alerts.length > 0) return

        const demoAlerts: Alert[] = [
            {
                id: 'alert-demo-1',
                patientId: 'john.doe@example.com',
                doctorId: 'DOC-001',
                type: 'critical',
                message: 'Critical SpO2 drop detected. Patient SpO2 has dropped to 85%. Immediate medical attention required.',
                factors: ['SpO2 < 85%', 'Rapid decline in oxygen saturation'],
                redFlagScore: 10,
                createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
                acknowledged: false,
                diseaseType: 'ILD'
            },
            {
                id: 'alert-demo-2',
                patientId: 'jane.smith@example.com',
                doctorId: 'DOC-001',
                type: 'high-risk',
                message: 'Asthma control deteriorating. Peak flow below 70% of personal best with increased rescue inhaler use.',
                factors: ['Peak flow <70%', 'Excessive rescue inhaler use', 'Night waking'],
                redFlagScore: 8,
                createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
                acknowledged: false,
                diseaseType: 'Asthma'
            },
            {
                id: 'alert-demo-3',
                patientId: 'mike.johnson@example.com',
                doctorId: 'DOC-001',
                type: 'pending-review',
                message: 'COPD symptoms worsening. Increased sputum production with color change to green.',
                factors: ['Purulent sputum', 'Increased cough frequency', 'Chest heaviness'],
                redFlagScore: 6,
                createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
                acknowledged: false,
                diseaseType: 'COPD'
            }
        ]

        localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(demoAlerts))
        console.log('Demo alerts initialized')
    } catch (error) {
        console.error('Error initializing demo alerts:', error)
    }
}

// Export data for alerts
export function exportAlertsData(doctorId: string, format: 'csv' | 'json' = 'csv'): string {
    const alerts = getDoctorAlerts(doctorId)

    if (format === 'json') {
        return JSON.stringify(alerts, null, 2)
    }

    // CSV format
    const headers = ['Alert ID', 'Patient ID', 'Type', 'Disease', 'Score', 'Message', 'Factors', 'Created At', 'Acknowledged']
    const rows = alerts.map(alert => [
        alert.id,
        alert.patientId,
        alert.type,
        alert.diseaseType,
        (alert.redFlagScore || 0).toString(),
        alert.message,
        (alert.factors || []).join('; '),
        alert.createdAt || '',
        alert.acknowledged ? 'Yes' : 'No'
    ])

    const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n')

    return csvContent
}