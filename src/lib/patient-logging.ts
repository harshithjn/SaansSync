// Patient Daily Logging System with Limits and Critical Alerts
import { DiseaseType, CommonPatientData, AsthmaData, COPDData, BronchiectasisData, ILDData, PostInfectionData, Alert } from './monitoring-types'
import { calculateRedFlagScore } from './red-flag-scoring'
import { createAlert } from './alert-system'
import { fetchRealTimeAQI, storeAQIData } from './aqi-service'

export interface DailyLogEntry {
    id: string
    patientId: string
    logDate: string
    logTime: string
    diseaseType: DiseaseType
    commonData: CommonPatientData
    diseaseSpecificData: AsthmaData | COPDData | BronchiectasisData | ILDData | PostInfectionData
    redFlagScore: number
    isWorstLogOfDay: boolean
    createdAt: string
}

const DAILY_LOG_STORAGE_KEY = 'patient_daily_logs'
const MAX_LOGS_PER_DAY = 2

// Get today's date in YYYY-MM-DD format
function getTodayDate(): string {
    return new Date().toISOString().split('T')[0]
}

// Get all logs for a patient
export function getPatientLogs(patientId: string): DailyLogEntry[] {
    if (typeof window === 'undefined') return []

    try {
        const stored = localStorage.getItem(DAILY_LOG_STORAGE_KEY)
        const allLogs = stored ? JSON.parse(stored) : {}
        return allLogs[patientId] || []
    } catch (error) {
        console.error('Error reading patient logs:', error)
        return []
    }
}

// Get today's logs for a patient
export function getTodayLogs(patientId: string): DailyLogEntry[] {
    const allLogs = getPatientLogs(patientId)
    const today = getTodayDate()
    return allLogs.filter(log => log.logDate === today)
}

// Check if patient can log today (max 2 logs per day)
export function canLogToday(patientId: string): boolean {
    const todayLogs = getTodayLogs(patientId)
    return todayLogs.length < MAX_LOGS_PER_DAY
}

// Get remaining logs for today
export function getRemainingLogsToday(patientId: string): number {
    const todayLogs = getTodayLogs(patientId)
    return Math.max(0, MAX_LOGS_PER_DAY - todayLogs.length)
}

// Create a new daily log entry
export async function createDailyLog(
    patientId: string,
    diseaseType: DiseaseType,
    commonData: Partial<CommonPatientData>,
    diseaseSpecificData: any,
    doctorId: string
): Promise<{ success: boolean; logEntry?: DailyLogEntry; alert?: Alert; error?: string }> {
    
    // Check daily limit
    if (!canLogToday(patientId)) {
        return {
            success: false,
            error: 'Daily logging limit reached (2 logs per day maximum)'
        }
    }

    try {
        // Fetch current AQI
        const aqiData = await fetchRealTimeAQI()
        storeAQIData(patientId, aqiData)

        // Prepare complete common data
        const completeCommonData: CommonPatientData = {
            patientId,
            firstLogDate: commonData.firstLogDate || new Date().toISOString(),
            aqi: {
                value: aqiData.aqi,
                pm25: aqiData.pm25,
                pm10: aqiData.pm10,
                location: aqiData.location,
                fetchedAt: aqiData.fetchedAt
            },
            spo2: commonData.spo2 || { atRest: 98, onExertion: 95, baselineTarget: 95 },
            conditionStatus: commonData.conditionStatus || {
                isStatic: true,
                hasWorsening: false,
                hasImprovement: false,
                oxygenChange: 0
            },
            mMRCScale: commonData.mMRCScale || 0,
            medications: commonData.medications || [],
            sideEffects: commonData.sideEffects || [],
            symptoms: commonData.symptoms || []
        }

        // Check for critical hemoptysis alert
        const hemoptysisAlert = checkHemoptysisAlert(diseaseSpecificData, diseaseType)
        if (hemoptysisAlert) {
            // Create immediate critical alert
            const alert = createAlert(
                patientId,
                doctorId,
                diseaseType,
                10,
                ['Hemoptysis > 100mL or more than one teacup'],
                '🚨 CRITICAL: Hemoptysis detected - Immediate medical attention required'
            )

            return {
                success: true,
                alert,
                error: 'Critical hemoptysis detected - Emergency medical attention required'
            }
        }

        // Calculate red flag score
        const scoringData = {
            patientId,
            diagnosis: diseaseType,
            spo2: completeCommonData.spo2.atRest,
            spo2BaselineDrop: diseaseSpecificData.spo2BaselineDrop,
            respiratoryRate: diseaseSpecificData.respiratoryRate,
            hasHemoptysis: checkForHemoptysis(diseaseSpecificData, diseaseType),
            mMRCIncrease: completeCommonData.mMRCScale > 2,
            medCompliance: checkMedicationCompliance(completeCommonData.medications),
            vasSymptomScore: getHighestSymptomScore(completeCommonData.symptoms),
            aqi: aqiData.aqi,
            diseaseData: diseaseSpecificData
        }

        const redFlagResult = calculateRedFlagScore(scoringData)

        // Create log entry
        const logEntry: DailyLogEntry = {
            id: generateLogId(),
            patientId,
            logDate: getTodayDate(),
            logTime: new Date().toTimeString().split(' ')[0],
            diseaseType,
            commonData: completeCommonData,
            diseaseSpecificData,
            redFlagScore: redFlagResult.score,
            isWorstLogOfDay: false, // Will be updated after saving
            createdAt: new Date().toISOString()
        }

        // Save log entry
        const saved = saveDailyLog(logEntry)
        if (!saved) {
            return {
                success: false,
                error: 'Failed to save log entry'
            }
        }

        // Update worst log of day
        updateWorstLogOfDay(patientId)

        // Create alerts if needed
        let alert: Alert | undefined
        if (redFlagResult.score >= 7) {
            alert = createAlert(
                patientId,
                doctorId,
                diseaseType,
                redFlagResult.score,
                redFlagResult.factors,
                `Red flag score: ${redFlagResult.score}/10 - ${redFlagResult.factors.join(', ')}`
            )
        }

        return {
            success: true,
            logEntry,
            alert
        }

    } catch (error) {
        console.error('Error creating daily log:', error)
        return {
            success: false,
            error: 'Failed to create log entry'
        }
    }
}

// Check for critical hemoptysis
function checkHemoptysisAlert(diseaseData: any, diseaseType: DiseaseType): boolean {
    switch (diseaseType) {
        case 'Bronchiectasis':
        case 'Post-Infection':
            return diseaseData.hasHemoptysis && (
                diseaseData.hemoptysisVolume > 100 || 
                diseaseData.hemoptysisAmount === 'more-than-teacup'
            )
        case 'ILD':
            return diseaseData.hemoptysis === true
        default:
            return false
    }
}

// Check for any hemoptysis
function checkForHemoptysis(diseaseData: any, diseaseType: DiseaseType): boolean {
    switch (diseaseType) {
        case 'Bronchiectasis':
        case 'Post-Infection':
            return diseaseData.hasHemoptysis === true
        case 'ILD':
            return diseaseData.hemoptysis === true
        default:
            return false
    }
}

// Check medication compliance
function checkMedicationCompliance(medications: any[]): boolean {
    if (!medications || medications.length === 0) return true
    
    const takenCount = medications.filter(med => med.taken).length
    const complianceRate = takenCount / medications.length
    return complianceRate >= 0.8 // 80% compliance threshold
}

// Get highest symptom VAS score
function getHighestSymptomScore(symptoms: any[]): number {
    if (!symptoms || symptoms.length === 0) return 0
    
    return Math.max(...symptoms.map(symptom => symptom.score || 0))
}

// Save daily log entry
function saveDailyLog(logEntry: DailyLogEntry): boolean {
    if (typeof window === 'undefined') return false

    try {
        const stored = localStorage.getItem(DAILY_LOG_STORAGE_KEY)
        const allLogs = stored ? JSON.parse(stored) : {}
        
        if (!allLogs[logEntry.patientId]) {
            allLogs[logEntry.patientId] = []
        }
        
        allLogs[logEntry.patientId].push(logEntry)
        
        // Keep only last 90 days of logs
        const ninetyDaysAgo = new Date()
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
        const cutoffDate = ninetyDaysAgo.toISOString().split('T')[0]
        
        allLogs[logEntry.patientId] = allLogs[logEntry.patientId].filter(
            (log: DailyLogEntry) => log.logDate >= cutoffDate
        )
        
        localStorage.setItem(DAILY_LOG_STORAGE_KEY, JSON.stringify(allLogs))
        return true
    } catch (error) {
        console.error('Error saving daily log:', error)
        return false
    }
}

// Update worst log of day (highest red flag score)
function updateWorstLogOfDay(patientId: string): void {
    const todayLogs = getTodayLogs(patientId)
    if (todayLogs.length === 0) return

    // Find log with highest red flag score
    const worstLog = todayLogs.reduce((worst, current) => 
        current.redFlagScore > worst.redFlagScore ? current : worst
    )

    // Update all logs for today
    const allLogs = getPatientLogs(patientId)
    const today = getTodayDate()
    
    const updatedLogs = allLogs.map(log => ({
        ...log,
        isWorstLogOfDay: log.logDate === today && log.id === worstLog.id
    }))

    // Save updated logs
    if (typeof window !== 'undefined') {
        try {
            const stored = localStorage.getItem(DAILY_LOG_STORAGE_KEY)
            const allData = stored ? JSON.parse(stored) : {}
            allData[patientId] = updatedLogs
            localStorage.setItem(DAILY_LOG_STORAGE_KEY, JSON.stringify(allData))
        } catch (error) {
            console.error('Error updating worst log of day:', error)
        }
    }
}

// Get worst logs for export (one per day)
export function getWorstLogsForExport(patientId: string, startDate: string, endDate: string): DailyLogEntry[] {
    const allLogs = getPatientLogs(patientId)
    
    return allLogs.filter(log => 
        log.logDate >= startDate && 
        log.logDate <= endDate && 
        log.isWorstLogOfDay
    ).sort((a, b) => a.logDate.localeCompare(b.logDate))
}

// Generate unique log ID
function generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Get logs by date range
export function getLogsByDateRange(patientId: string, startDate: string, endDate: string): DailyLogEntry[] {
    const allLogs = getPatientLogs(patientId)
    
    return allLogs.filter(log => 
        log.logDate >= startDate && log.logDate <= endDate
    ).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

// Get latest log for a patient
export function getLatestLog(patientId: string): DailyLogEntry | null {
    const allLogs = getPatientLogs(patientId)
    if (allLogs.length === 0) return null
    
    return allLogs.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
}

// Delete a log entry
export function deleteLogEntry(patientId: string, logId: string): boolean {
    if (typeof window === 'undefined') return false

    try {
        const stored = localStorage.getItem(DAILY_LOG_STORAGE_KEY)
        const allLogs = stored ? JSON.parse(stored) : {}
        
        if (!allLogs[patientId]) return false
        
        allLogs[patientId] = allLogs[patientId].filter((log: DailyLogEntry) => log.id !== logId)
        
        localStorage.setItem(DAILY_LOG_STORAGE_KEY, JSON.stringify(allLogs))
        
        // Update worst log of day after deletion
        updateWorstLogOfDay(patientId)
        
        return true
    } catch (error) {
        console.error('Error deleting log entry:', error)
        return false
    }
}

// Schedule daily reminder notification (8:00 PM)
export function scheduleDailyReminder(patientId: string): void {
    if (typeof window === 'undefined' || !('Notification' in window)) return

    // Request notification permission
    if (Notification.permission === 'default') {
        Notification.requestPermission()
    }

    // Calculate time until 8:00 PM today or tomorrow
    const now = new Date()
    const reminderTime = new Date()
    reminderTime.setHours(20, 0, 0, 0) // 8:00 PM

    if (reminderTime <= now) {
        // If 8:00 PM has passed today, schedule for tomorrow
        reminderTime.setDate(reminderTime.getDate() + 1)
    }

    const timeUntilReminder = reminderTime.getTime() - now.getTime()

    setTimeout(() => {
        if (Notification.permission === 'granted') {
            new Notification('Health Log Reminder', {
                body: 'Gentle reminder to log your health status for today',
                icon: '/favicon.ico',
                tag: `health-reminder-${patientId}`
            })
        }

        // Schedule next day's reminder
        scheduleDailyReminder(patientId)
    }, timeUntilReminder)
}