// PFT (Pulmonary Function Test) History Management
export interface PFTRecord {
    id: string
    patientId: string
    testDate: string
    testType: 'Spirometry' | 'DLCO' | '6MWT' | 'Complete PFT'
    
    // Spirometry values
    fvc?: {
        predicted: number
        actual: number
        percentage: number
        lowerLimit: number
    }
    fev1?: {
        predicted: number
        actual: number
        percentage: number
        lowerLimit: number
    }
    fev1_fvc_ratio?: number
    
    // DLCO values
    dlco?: {
        predicted: number
        actual: number
        percentage: number
        lowerLimit: number
    }
    dlco_va?: {
        predicted: number
        actual: number
        percentage: number
    }
    
    // 6-Minute Walk Test
    sixMWT?: {
        distance: number // meters
        predictedDistance: number
        percentage: number
        initialSpO2: number
        finalSpO2: number
        minSpO2: number
        initialHR: number
        finalHR: number
        maxHR: number
        borgScale: number // 0-10
        oxygenUsed: boolean
        oxygenFlow?: number // L/min
    }
    
    // Additional measurements
    peakFlow?: number // L/min
    personalBest?: number // L/min for asthma patients
    
    // Clinical notes
    technician: string
    clinicalNotes?: string
    qualityGrade: 'A' | 'B' | 'C' | 'D' | 'F'
    
    // Interpretation
    interpretation: 'Normal' | 'Mild' | 'Moderate' | 'Severe' | 'Very Severe'
    pattern: 'Normal' | 'Obstructive' | 'Restrictive' | 'Mixed' | 'Indeterminate'
    
    // Comparison with previous
    changeFromPrevious?: {
        fvcChange: number // percentage change
        fev1Change: number
        dlcoChange?: number
        sixMWTChange?: number
        trend: 'Improved' | 'Stable' | 'Declined'
    }
    
    createdAt: string
    updatedAt: string
}

const PFT_STORAGE_KEY = 'pft_records'

// Add new PFT record
export function addPFTRecord(record: Omit<PFTRecord, 'id' | 'createdAt' | 'updatedAt'>): PFTRecord {
    const newRecord: PFTRecord = {
        ...record,
        id: `pft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
    
    // Calculate change from previous if available
    const previousRecords = getPatientPFTHistory(record.patientId)
    if (previousRecords.length > 0) {
        const lastRecord = previousRecords[previousRecords.length - 1]
        newRecord.changeFromPrevious = calculatePFTChanges(lastRecord, newRecord)
    }
    
    storePFTRecord(newRecord)
    return newRecord
}

// Store PFT record
function storePFTRecord(record: PFTRecord): void {
    if (typeof window === 'undefined') return

    try {
        const stored = localStorage.getItem(PFT_STORAGE_KEY)
        const records: PFTRecord[] = stored ? JSON.parse(stored) : []
        records.push(record)
        localStorage.setItem(PFT_STORAGE_KEY, JSON.stringify(records))
    } catch (error) {
        console.error('Error storing PFT record:', error)
    }
}

// Get PFT history for a patient
export function getPatientPFTHistory(patientId: string): PFTRecord[] {
    if (typeof window === 'undefined') return []

    try {
        const stored = localStorage.getItem(PFT_STORAGE_KEY)
        const records: PFTRecord[] = stored ? JSON.parse(stored) : []
        return records
            .filter(record => record.patientId === patientId)
            .sort((a, b) => new Date(a.testDate).getTime() - new Date(b.testDate).getTime())
    } catch (error) {
        console.error('Error getting PFT history:', error)
        return []
    }
}

// Get latest PFT record for a patient
export function getLatestPFTRecord(patientId: string): PFTRecord | null {
    const history = getPatientPFTHistory(patientId)
    return history.length > 0 ? history[history.length - 1] : null
}

// Calculate changes between PFT records
function calculatePFTChanges(previous: PFTRecord, current: PFTRecord): PFTRecord['changeFromPrevious'] {
    const changes: PFTRecord['changeFromPrevious'] = {
        fvcChange: 0,
        fev1Change: 0,
        trend: 'Stable'
    }

    // Calculate FVC change
    if (previous.fvc && current.fvc) {
        changes.fvcChange = ((current.fvc.percentage - previous.fvc.percentage) / previous.fvc.percentage) * 100
    }

    // Calculate FEV1 change
    if (previous.fev1 && current.fev1) {
        changes.fev1Change = ((current.fev1.percentage - previous.fev1.percentage) / previous.fev1.percentage) * 100
    }

    // Calculate DLCO change
    if (previous.dlco && current.dlco) {
        changes.dlcoChange = ((current.dlco.percentage - previous.dlco.percentage) / previous.dlco.percentage) * 100
    }

    // Calculate 6MWT change
    if (previous.sixMWT && current.sixMWT) {
        changes.sixMWTChange = ((current.sixMWT.distance - previous.sixMWT.distance) / previous.sixMWT.distance) * 100
    }

    // Determine overall trend
    const significantChanges = []
    if (Math.abs(changes.fvcChange) >= 10) significantChanges.push(changes.fvcChange)
    if (Math.abs(changes.fev1Change) >= 10) significantChanges.push(changes.fev1Change)
    if (changes.dlcoChange && Math.abs(changes.dlcoChange) >= 15) significantChanges.push(changes.dlcoChange)

    if (significantChanges.length > 0) {
        const averageChange = significantChanges.reduce((sum, change) => sum + change, 0) / significantChanges.length
        changes.trend = averageChange > 0 ? 'Improved' : 'Declined'
    }

    return changes
}

// Interpret PFT results
export function interpretPFTResults(record: PFTRecord): {
    severity: string
    pattern: string
    recommendations: string[]
} {
    const recommendations: string[] = []
    let severity = 'Normal'
    let pattern = 'Normal'

    // Determine severity based on FEV1
    if (record.fev1) {
        const fev1Percent = record.fev1.percentage
        if (fev1Percent >= 80) {
            severity = 'Normal'
        } else if (fev1Percent >= 70) {
            severity = 'Mild'
        } else if (fev1Percent >= 50) {
            severity = 'Moderate'
        } else if (fev1Percent >= 30) {
            severity = 'Severe'
        } else {
            severity = 'Very Severe'
        }
    }

    // Determine pattern
    if (record.fev1 && record.fvc && record.fev1_fvc_ratio) {
        const fev1Percent = record.fev1.percentage
        const fvcPercent = record.fvc.percentage
        const ratio = record.fev1_fvc_ratio

        if (ratio < 0.70 && fev1Percent < 80) {
            pattern = 'Obstructive'
            recommendations.push('Consider bronchodilator therapy')
            recommendations.push('Pulmonary rehabilitation may be beneficial')
        } else if (ratio >= 0.70 && fvcPercent < 80 && fev1Percent < 80) {
            pattern = 'Restrictive'
            recommendations.push('Consider further evaluation for interstitial lung disease')
            recommendations.push('Chest imaging may be warranted')
        } else if (ratio < 0.70 && fvcPercent < 80) {
            pattern = 'Mixed'
            recommendations.push('Complex pattern requires specialist evaluation')
        }
    }

    // DLCO-specific recommendations
    if (record.dlco && record.dlco.percentage < 80) {
        recommendations.push('Reduced gas transfer - consider evaluation for ILD or pulmonary vascular disease')
    }

    // 6MWT-specific recommendations
    if (record.sixMWT) {
        if (record.sixMWT.percentage < 80) {
            recommendations.push('Reduced exercise capacity - consider pulmonary rehabilitation')
        }
        if (record.sixMWT.minSpO2 < 88) {
            recommendations.push('Significant desaturation on exertion - consider oxygen assessment')
        }
    }

    // Trend-based recommendations
    if (record.changeFromPrevious?.trend === 'Declined') {
        recommendations.push('Declining lung function - consider treatment optimization')
        recommendations.push('More frequent monitoring may be needed')
    }

    return { severity, pattern, recommendations }
}

// Generate PFT trend data for charts
export function generatePFTTrendData(patientId: string): {
    dates: string[]
    fvc: number[]
    fev1: number[]
    dlco: number[]
    sixMWT: number[]
} {
    const history = getPatientPFTHistory(patientId)
    
    return {
        dates: history.map(record => record.testDate),
        fvc: history.map(record => record.fvc?.percentage || 0),
        fev1: history.map(record => record.fev1?.percentage || 0),
        dlco: history.map(record => record.dlco?.percentage || 0),
        sixMWT: history.map(record => record.sixMWT?.percentage || 0)
    }
}

// Calculate predicted values based on demographics
export function calculatePredictedValues(
    age: number,
    height: number, // cm
    gender: 'male' | 'female',
    ethnicity: 'caucasian' | 'african-american' | 'hispanic' | 'asian' = 'caucasian'
): {
    fvc: number
    fev1: number
    dlco: number
    sixMWT: number
} {
    // Simplified prediction equations (in practice, use GLI-2012 equations)
    const heightM = height / 100
    
    let fvc, fev1, dlco, sixMWT
    
    if (gender === 'male') {
        fvc = (5.76 * heightM) - (0.026 * age) - 4.34
        fev1 = (4.30 * heightM) - (0.029 * age) - 2.49
        dlco = (7.57 * heightM) - (0.187 * age) - 1.18
        sixMWT = 1140 - (5.61 * age) + (2.69 * height)
    } else {
        fvc = (4.43 * heightM) - (0.026 * age) - 2.89
        fev1 = (3.18 * heightM) - (0.025 * age) - 1.08
        dlco = (6.14 * heightM) - (0.178 * age) + 0.39
        sixMWT = 1017 - (6.24 * age) + (2.11 * height)
    }
    
    // Apply ethnicity corrections
    if (ethnicity === 'african-american') {
        fvc *= 0.88
        fev1 *= 0.88
        dlco *= 0.88
    } else if (ethnicity === 'asian') {
        fvc *= 0.93
        fev1 *= 0.93
        dlco *= 0.93
    }
    
    return {
        fvc: Math.round(fvc * 1000) / 1000, // L
        fev1: Math.round(fev1 * 1000) / 1000, // L
        dlco: Math.round(dlco * 100) / 100, // mmol/min/kPa
        sixMWT: Math.round(sixMWT) // meters
    }
}

// Update PFT record
export function updatePFTRecord(recordId: string, updates: Partial<PFTRecord>): boolean {
    if (typeof window === 'undefined') return false

    try {
        const stored = localStorage.getItem(PFT_STORAGE_KEY)
        const records: PFTRecord[] = stored ? JSON.parse(stored) : []
        
        const recordIndex = records.findIndex(record => record.id === recordId)
        if (recordIndex >= 0) {
            records[recordIndex] = {
                ...records[recordIndex],
                ...updates,
                updatedAt: new Date().toISOString()
            }
            localStorage.setItem(PFT_STORAGE_KEY, JSON.stringify(records))
            return true
        }
        return false
    } catch (error) {
        console.error('Error updating PFT record:', error)
        return false
    }
}

// Delete PFT record
export function deletePFTRecord(recordId: string): boolean {
    if (typeof window === 'undefined') return false

    try {
        const stored = localStorage.getItem(PFT_STORAGE_KEY)
        const records: PFTRecord[] = stored ? JSON.parse(stored) : []
        
        const filteredRecords = records.filter(record => record.id !== recordId)
        localStorage.setItem(PFT_STORAGE_KEY, JSON.stringify(filteredRecords))
        return true
    } catch (error) {
        console.error('Error deleting PFT record:', error)
        return false
    }
}

// Export PFT data
export function exportPFTData(patientId: string, format: 'csv' | 'json' = 'csv'): string {
    const history = getPatientPFTHistory(patientId)
    
    if (format === 'json') {
        return JSON.stringify(history, null, 2)
    }
    
    // CSV format
    const headers = [
        'Test Date', 'Test Type', 'FVC %', 'FEV1 %', 'FEV1/FVC Ratio', 
        'DLCO %', '6MWT Distance', '6MWT %', 'Interpretation', 'Pattern',
        'Quality Grade', 'Technician', 'Clinical Notes'
    ]
    
    const rows = history.map(record => [
        record.testDate,
        record.testType,
        record.fvc?.percentage?.toString() || '',
        record.fev1?.percentage?.toString() || '',
        record.fev1_fvc_ratio?.toString() || '',
        record.dlco?.percentage?.toString() || '',
        record.sixMWT?.distance?.toString() || '',
        record.sixMWT?.percentage?.toString() || '',
        record.interpretation,
        record.pattern,
        record.qualityGrade,
        record.technician,
        record.clinicalNotes || ''
    ])
    
    return [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n')
}