// Export Data Service
import api from './api'
import { formatDate } from './utils'
import { ExportOptions, PatientFolder, CommonPatientData, AsthmaData, COPDData, BronchiectasisData, ILDData, PostInfectionData } from './monitoring-types'
import { getDoctorPatientFolders } from './doctor-patient-mapping'
import { getPatientAlerts } from './alert-system'

// Export patient data in various formats
export function exportPatientData(
    doctorId: string,
    options: ExportOptions
): { data: string; filename: string; mimeType: string } {
    const patients = getDoctorPatientFolders(doctorId)
    const filteredPatients = options.patientIds.length > 0
        ? patients.filter(p => options.patientIds.includes(p.patientId))
        : patients

    const exportData = generateExportData(filteredPatients, options)

    switch (options.format) {
        case 'csv':
            return {
                data: generateCSV(exportData, options),
                filename: `patient-data-${new Date().toISOString().split('T')[0]}.csv`,
                mimeType: 'text/csv'
            }
        case 'excel':
            return {
                data: generateExcelData(exportData, options),
                filename: `patient-data-${new Date().toISOString().split('T')[0]}.xlsx`,
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            }
        case 'pdf':
            return {
                data: generatePDFData(exportData, options),
                filename: `patient-report-${new Date().toISOString().split('T')[0]}.pdf`,
                mimeType: 'application/pdf'
            }
        default:
            throw new Error('Unsupported export format')
    }
}

// Generate export data structure
function generateExportData(patients: PatientFolder[], options: ExportOptions) {
    const startDate = new Date(options.dateRange.start)
    const endDate = new Date(options.dateRange.end)

    return patients.map(patient => {
        const commonData = getCommonPatientData(patient.patientId)
        const diseaseData = getDiseaseSpecificData(patient.patientId, patient.diseaseType)
        const alerts = getPatientAlerts(patient.patientId)
        const filteredAlerts = alerts.filter(alert => {
            const alertDate = new Date(alert.createdAt || new Date())
            return alertDate >= startDate && alertDate <= endDate
        })

        return {
            patient,
            commonData,
            diseaseData,
            alerts: filteredAlerts,
            summary: generatePatientSummary(patient, commonData, diseaseData, filteredAlerts)
        }
    })
}

// Get common patient data from localStorage
function getCommonPatientData(patientId: string): CommonPatientData | null {
    if (typeof window === 'undefined') return null

    try {
        const stored = localStorage.getItem(`common_patient_data_${patientId}`)
        return stored ? JSON.parse(stored) : null
    } catch (error) {
        console.error('Error loading common patient data:', error)
        return null
    }
}

// Get disease-specific data from localStorage
function getDiseaseSpecificData(patientId: string, diseaseType: string): any {
    if (typeof window === 'undefined') return null

    try {
        const key = `${diseaseType.toLowerCase().replace('-', '_')}_data_${patientId}`
        const stored = localStorage.getItem(key)
        return stored ? JSON.parse(stored) : null
    } catch (error) {
        console.error('Error loading disease-specific data:', error)
        return null
    }
}

// Generate patient summary
function generatePatientSummary(
    patient: PatientFolder,
    commonData: CommonPatientData | null,
    diseaseData: any,
    alerts: any[]
) {
    return {
        riskLevel: patient.redFlagScore >= 9 ? 'Critical' :
            patient.redFlagScore >= 7 ? 'High' :
                patient.redFlagScore >= 4 ? 'Moderate' : 'Low',
        alertCount: alerts.length,
        criticalAlerts: alerts.filter(a => a.type === 'critical').length,
        lastActivity: patient.lastLogDate,
        currentSpO2: commonData?.spo2.atRest || 'N/A',
        conditionStatus: commonData?.conditionStatus.isStatic ? 'Static' :
            commonData?.conditionStatus.hasWorsening ? 'Worsening' :
                commonData?.conditionStatus.hasImprovement ? 'Improving' : 'Unknown',
        mMRCScale: commonData?.mMRCScale || 'N/A',
        aqiLevel: commonData?.aqi.value || 'N/A'
    }
}

// Generate CSV format
function generateCSV(exportData: any[], options: ExportOptions): string {
    const headers = [
        'Patient ID',
        'Full Name',
        'Age',
        'Disease Type',
        'Risk Score',
        'Risk Level',
        'Alert Count',
        'Critical Alerts',
        'Last Activity',
        'SpO2 at Rest',
        'Condition Status',
        'mMRC Scale',
        'AQI Level'
    ]

    if (options.diseaseSpecific) {
        // Add disease-specific headers based on the first patient's disease type
        if (exportData.length > 0) {
            const diseaseType = exportData[0].patient.diseaseType
            headers.push(...getDiseaseSpecificHeaders(diseaseType))
        }
    }

    const rows = exportData.map(item => {
        const baseRow = [
            item.patient.patientId,
            item.patient.fullName,
            item.patient.age.toString(),
            item.patient.diseaseType,
            item.patient.redFlagScore.toString(),
            item.summary.riskLevel,
            item.summary.alertCount.toString(),
            item.summary.criticalAlerts.toString(),
            formatDate(item.summary.lastActivity),
            item.summary.currentSpO2.toString(),
            item.summary.conditionStatus,
            item.summary.mMRCScale.toString(),
            item.summary.aqiLevel.toString()
        ]

        if (options.diseaseSpecific && item.diseaseData) {
            baseRow.push(...getDiseaseSpecificValues(item.patient.diseaseType, item.diseaseData))
        }

        return baseRow
    })

    return [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n')
}

// Get disease-specific CSV headers
function getDiseaseSpecificHeaders(diseaseType: string): string[] {
    switch (diseaseType) {
        case 'Asthma':
            return [
                'Control Level',
                'Peak Flow %',
                'Rescue Puffs/Day',
                'Night Waking',
                'Activity Limitation'
            ]
        case 'COPD':
            return [
                'Cough Frequency',
                'Phlegm Production',
                'Energy Level',
                'Chest Heaviness',
                'Sputum Color',
                'Fever'
            ]
        case 'ILD':
            return [
                'Breathlessness Change',
                'Dry Cough Severity',
                'Fatigue Level',
                'Rest Oxygen (L/min)',
                'Exertional Oxygen (L/min)',
                'SpO2 Baseline Drop'
            ]
        case 'Bronchiectasis':
            return [
                'Sputum Volume',
                'Sputum Color',
                'Ease of Clearance',
                'Fever',
                'Malaise',
                'Hemoptysis'
            ]
        case 'Post-Infection':
            return [
                'Exercise Tolerance Improvement',
                'Appetite',
                'Weight Change (kg)',
                'Persistent Cough',
                'Hemoptysis',
                'Sputum Volume'
            ]
        default:
            return []
    }
}

// Get disease-specific CSV values
function getDiseaseSpecificValues(diseaseType: string, diseaseData: any): string[] {
    switch (diseaseType) {
        case 'Asthma':
            const asthmaData = diseaseData as AsthmaData
            return [
                asthmaData.controlLevel || 'N/A',
                asthmaData.peakFlowPercent?.toString() || 'N/A',
                asthmaData.rescueInhalerPuffs?.toString() || 'N/A',
                asthmaData.nightWaking ? 'Yes' : 'No',
                asthmaData.activityLimitation ? 'Yes' : 'No'
            ]
        case 'COPD':
            const copdData = diseaseData as COPDData
            return [
                copdData.coughFrequency?.toString() || 'N/A',
                copdData.phlegmProduction?.toString() || 'N/A',
                copdData.energyLevel?.toString() || 'N/A',
                copdData.chestHeaviness?.toString() || 'N/A',
                copdData.sputumColor || 'N/A',
                copdData.fever ? 'Yes' : 'No'
            ]
        case 'ILD':
            const ildData = diseaseData as ILDData
            return [
                ildData.breathlessnessChange || 'N/A',
                ildData.dryCoughSeverity?.toString() || 'N/A',
                ildData.fatigueLevel?.toString() || 'N/A',
                ildData.restOxygen?.toString() || 'N/A',
                ildData.exertionalOxygen?.toString() || 'N/A',
                ildData.spo2BaselineDrop?.toString() || 'N/A'
            ]
        case 'Bronchiectasis':
            const bronchData = diseaseData as BronchiectasisData
            return [
                bronchData.sputumVolume || 'N/A',
                bronchData.sputumColor || 'N/A',
                bronchData.easeOfClearance?.toString() || 'N/A',
                bronchData.fever ? 'Yes' : 'No',
                bronchData.malaise ? 'Yes' : 'No',
                bronchData.hasHemoptysis ? 'Yes' : 'No'
            ]
        case 'Post-Infection':
            const postData = diseaseData as PostInfectionData
            return [
                postData.exerciseToleranceImprovement ? 'Yes' : 'No',
                postData.appetite || 'N/A',
                postData.weightChange?.toString() || 'N/A',
                postData.persistentCough ? 'Yes' : 'No',
                postData.hemoptysis ? 'Yes' : 'No',
                postData.sputumVolume || 'N/A'
            ]
        default:
            return []
    }
}

// Generate Excel data (simplified - would need a library like xlsx for full implementation)
function generateExcelData(exportData: any[], options: ExportOptions): string {
    // For now, return CSV format with Excel MIME type
    // In a real implementation, you'd use a library like xlsx to generate proper Excel files
    return generateCSV(exportData, options)
}

// Generate PDF data (simplified - would need a library like jsPDF for full implementation)
function generatePDFData(exportData: any[], options: ExportOptions): string {
    // For now, return a formatted text report
    // In a real implementation, you'd use a library like jsPDF to generate proper PDFs
    let report = `PATIENT MONITORING REPORT\n`
    report += `Generated: ${new Date().toLocaleString()}\n`
    report += `Date Range: ${options.dateRange.start} to ${options.dateRange.end}\n\n`

    exportData.forEach((item, index) => {
        report += `${index + 1}. ${item.patient.fullName} (${item.patient.patientId})\n`
        report += `   Disease: ${item.patient.diseaseType}\n`
        report += `   Risk Score: ${item.patient.redFlagScore}/10 (${item.summary.riskLevel})\n`
        report += `   Alerts: ${item.summary.alertCount} (${item.summary.criticalAlerts} critical)\n`
        report += `   Last Activity: ${formatDate(item.summary.lastActivity)}\n`
        report += `   SpO2: ${item.summary.currentSpO2}%\n`
        report += `   Condition: ${item.summary.conditionStatus}\n\n`
    })

    return report
}

// Download file helper
export function downloadFile(data: string, filename: string, mimeType: string): void {
    if (typeof window === 'undefined') return

    const blob = new Blob([data], { type: mimeType })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
}

// Generate summary statistics for export
export function generateExportSummary(doctorId: string): {
    totalPatients: number
    byDisease: Record<string, number>
    byRiskLevel: Record<string, number>
    totalAlerts: number
    criticalAlerts: number
} {
    const patients = getDoctorPatientFolders(doctorId)

    const byDisease: Record<string, number> = {}
    const byRiskLevel: Record<string, number> = {
        'Low': 0,
        'Moderate': 0,
        'High': 0,
        'Critical': 0
    }

    let totalAlerts = 0
    let criticalAlerts = 0

    patients.forEach(patient => {
        // Count by disease
        byDisease[patient.diseaseType] = (byDisease[patient.diseaseType] || 0) + 1

        // Count by risk level
        const riskLevel = patient.redFlagScore >= 9 ? 'Critical' :
            patient.redFlagScore >= 7 ? 'High' :
                patient.redFlagScore >= 4 ? 'Moderate' : 'Low'
        byRiskLevel[riskLevel]++

        // Count alerts
        const alerts = getPatientAlerts(patient.patientId)
        totalAlerts += alerts.length
        criticalAlerts += alerts.filter(a => a.type === 'critical').length
    })

    return {
        totalPatients: patients.length,
        byDisease,
        byRiskLevel,
        totalAlerts,
        criticalAlerts
    }
}