import { CommonPatientData, AsthmaData, COPDData, BronchiectasisData, ILDData, PostInfectionData, DiseaseType } from './monitoring-types'
import { getPatientPFTHistory, PFTRecord } from './pft-history'
import { getPatientAlerts } from './alert-system'

export interface AnalyticsData {
    patientId: string
    diseaseType: DiseaseType
    dateRange: {
        start: string
        end: string
    }
    trends: {
        spo2Trend: TrendData
        symptomTrends: SymptomTrendData[]
        medicationCompliance: ComplianceData
        alertFrequency: AlertFrequencyData
        diseaseSpecificTrends: any
    }
    insights: AnalyticsInsight[]
    recommendations: string[]
}

export interface TrendData {
    dates: string[]
    values: number[]
    trend: 'improving' | 'stable' | 'declining'
    changePercent: number
}

export interface SymptomTrendData {
    symptomName: string
    dates: string[]
    scores: number[]
    trend: 'improving' | 'stable' | 'worsening'
    averageScore: number
}

export interface ComplianceData {
    totalDays: number
    compliantDays: number
    complianceRate: number
    missedMedications: string[]
}

export interface AlertFrequencyData {
    dates: string[]
    alertCounts: number[]
    criticalAlerts: number[]
    totalAlerts: number
}

export interface AnalyticsInsight {
    type: 'positive' | 'neutral' | 'concerning' | 'critical'
    title: string
    description: string
    impact: 'low' | 'medium' | 'high'
    actionRequired: boolean
}

export function generatePatientAnalytics(
    patientId: string,
    diseaseType: DiseaseType,
    dateRange: { start: string; end: string }
): AnalyticsData {
    const commonData = getCommonPatientDataHistory(patientId, dateRange)
    const diseaseData = getDiseaseSpecificDataHistory(patientId, diseaseType, dateRange)
    const pftHistory = getPatientPFTHistory(patientId)
    const alerts = getPatientAlerts(patientId)

    const trends = generateTrends(commonData, diseaseData, pftHistory, alerts, dateRange)
    const insights = generateInsights(trends, diseaseType)
    const recommendations = generateRecommendations(insights, trends, diseaseType)

    return {
        patientId,
        diseaseType,
        dateRange,
        trends,
        insights,
        recommendations
    }
}

function generateTrends(
    commonData: CommonPatientData[],
    diseaseData: any[],
    pftHistory: PFTRecord[],
    alerts: any[],
    dateRange: { start: string; end: string }
): AnalyticsData['trends'] {

    const spo2Trend = generateSpo2Trend(commonData)

    const symptomTrends = generateSymptomTrends(commonData)

    const medicationCompliance = generateComplianceData(commonData)

    const alertFrequency = generateAlertFrequency(alerts, dateRange)

    const diseaseSpecificTrends = generateDiseaseSpecificTrends(diseaseData)

    return {
        spo2Trend,
        symptomTrends,
        medicationCompliance,
        alertFrequency,
        diseaseSpecificTrends
    }
}

function generateSpo2Trend(commonData: CommonPatientData[]): TrendData {
    const dates = commonData.map(data => data.firstLogDate.split('T')[0])
    const values = commonData.map(data => data.spo2.atRest)

    const trend = calculateTrend(values)
    const changePercent = values.length > 1
        ? ((values[values.length - 1] - values[0]) / values[0]) * 100
        : 0

    return {
        dates,
        values,
        trend: changePercent > 2 ? 'improving' : changePercent < -2 ? 'declining' : 'stable',
        changePercent
    }
}

function generateSymptomTrends(commonData: CommonPatientData[]): SymptomTrendData[] {
    const symptomMap = new Map<string, { dates: string[], scores: number[] }>()

    commonData.forEach(data => {
        const date = data.firstLogDate.split('T')[0]
        data.symptoms.forEach(symptom => {
            if (!symptomMap.has(symptom.name)) {
                symptomMap.set(symptom.name, { dates: [], scores: [] })
            }
            const symptomData = symptomMap.get(symptom.name)!
            symptomData.dates.push(date)
            symptomData.scores.push(symptom.score)
        })
    })

    return Array.from(symptomMap.entries()).map(([name, data]) => {
        const trend = calculateTrend(data.scores)
        const averageScore = data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length

        return {
            symptomName: name,
            dates: data.dates,
            scores: data.scores,
            trend: averageScore > 7 ? 'worsening' : averageScore < 4 ? 'improving' : 'stable',
            averageScore
        }
    })
}

function generateComplianceData(commonData: CommonPatientData[]): ComplianceData {
    const totalDays = commonData.length
    let compliantDays = 0
    const missedMedications: string[] = []

    commonData.forEach(data => {
        const dayCompliant = data.medications.every(med => med.taken)
        if (dayCompliant) compliantDays++

        data.medications.forEach(med => {
            if (!med.taken && !missedMedications.includes(med.drugName)) {
                missedMedications.push(med.drugName)
            }
        })
    })

    return {
        totalDays,
        compliantDays,
        complianceRate: totalDays > 0 ? (compliantDays / totalDays) * 100 : 0,
        missedMedications
    }
}

function generateAlertFrequency(alerts: any[], dateRange: { start: string; end: string }): AlertFrequencyData {
    const startDate = new Date(dateRange.start)
    const endDate = new Date(dateRange.end)

    const filteredAlerts = alerts.filter(alert => {
        const alertDate = new Date(alert.createdAt)
        return alertDate >= startDate && alertDate <= endDate
    })

    const alertsByDate = new Map<string, { total: number; critical: number }>()

    filteredAlerts.forEach(alert => {
        const date = alert.createdAt.split('T')[0]
        if (!alertsByDate.has(date)) {
            alertsByDate.set(date, { total: 0, critical: 0 })
        }
        const dayData = alertsByDate.get(date)!
        dayData.total++
        if (alert.type === 'critical') dayData.critical++
    })

    const dates = Array.from(alertsByDate.keys()).sort()
    const alertCounts = dates.map(date => alertsByDate.get(date)!.total)
    const criticalAlerts = dates.map(date => alertsByDate.get(date)!.critical)

    return {
        dates,
        alertCounts,
        criticalAlerts,
        totalAlerts: filteredAlerts.length
    }
}

function generateDiseaseSpecificTrends(diseaseData: any[]): any {
    if (diseaseData.length === 0) return {}

    const firstRecord = diseaseData[0]

    if ('controlLevel' in firstRecord) {

        return generateAsthmaTrends(diseaseData as AsthmaData[])
    } else if ('coughFrequency' in firstRecord) {

        return generateCOPDTrends(diseaseData as COPDData[])
    } else if ('breathlessnessChange' in firstRecord) {

        return generateILDTrends(diseaseData as ILDData[])
    } else if ('sputumVolume' in firstRecord) {

        return generateBronchiectasisTrends(diseaseData as BronchiectasisData[])
    }

    return {}
}

function generateAsthmaTrends(data: AsthmaData[]): any {
    return {
        peakFlowTrend: {
            dates: data.map(d => d.logDate),
            values: data.map(d => d.peakFlowPercent || 0),
            trend: calculateTrend(data.map(d => d.peakFlowPercent || 0))
        },
        rescueInhalerUse: {
            dates: data.map(d => d.logDate),
            values: data.map(d => d.rescueInhalerPuffs),
            averageUse: data.reduce((sum, d) => sum + d.rescueInhalerPuffs, 0) / data.length
        },
        controlLevels: {
            wellControlled: data.filter(d => d.controlLevel === 'well-controlled').length,
            partlyControlled: data.filter(d => d.controlLevel === 'partly-controlled').length,
            uncontrolled: data.filter(d => d.controlLevel === 'uncontrolled').length
        }
    }
}

function generateCOPDTrends(data: COPDData[]): any {
    return {
        exacerbationRisk: {
            dates: data.map(d => d.logDate),
            coughLevels: data.map(d => d.coughFrequency),
            phlegmLevels: data.map(d => d.phlegmProduction),
            energyLevels: data.map(d => d.energyLevel)
        },
        sputumAnalysis: {
            colorDistribution: {
                white: data.filter(d => d.sputumColor === 'white').length,
                yellow: data.filter(d => d.sputumColor === 'yellow').length,
                green: data.filter(d => d.sputumColor === 'dark-green').length
            },
            volumeDistribution: {
                none: data.filter(d => d.sputumVolume === 'none').length,
                small: data.filter(d => d.sputumVolume === 'small').length,
                moderate: data.filter(d => d.sputumVolume === 'moderate').length,
                large: data.filter(d => d.sputumVolume === 'large').length
            }
        }
    }
}

function generateILDTrends(data: ILDData[]): any {
    return {
        progressionMonitoring: {
            dates: data.map(d => d.logDate),
            breathlessnessChanges: data.map(d => d.breathlessnessChange),
            dryCoughSeverity: data.map(d => d.dryCoughSeverity),
            fatigueLevel: data.map(d => d.fatigueLevel)
        },
        oxygenDependency: {
            dates: data.map(d => d.logDate),
            restOxygen: data.map(d => d.restOxygen),
            exertionalOxygen: data.map(d => d.exertionalOxygen),
            oxygenIncrease: data.filter(d => d.oxygenIncrease).length
        }
    }
}

function generateBronchiectasisTrends(data: BronchiectasisData[]): any {
    return {
        infectionMonitoring: {
            dates: data.map(d => d.logDate),
            feverIncidence: data.filter(d => d.fever).length,
            hemoptysisIncidence: data.filter(d => d.hasHemoptysis).length,
            malaiseIncidence: data.filter(d => d.malaise).length
        },
        sputumTracking: {
            volumeTrend: data.map(d => d.sputumVolume),
            colorTrend: data.map(d => d.sputumColor),
            clearanceEase: data.map(d => d.easeOfClearance)
        }
    }
}

function generateInsights(trends: AnalyticsData['trends'], diseaseType: DiseaseType): AnalyticsInsight[] {
    const insights: AnalyticsInsight[] = []

    if (trends.spo2Trend.trend === 'declining') {
        insights.push({
            type: 'concerning',
            title: 'Declining Oxygen Saturation',
            description: `SpO2 levels have declined by ${Math.abs(trends.spo2Trend.changePercent).toFixed(1)}% over the monitoring period.`,
            impact: 'high',
            actionRequired: true
        })
    } else if (trends.spo2Trend.trend === 'improving') {
        insights.push({
            type: 'positive',
            title: 'Improving Oxygen Saturation',
            description: `SpO2 levels have improved by ${trends.spo2Trend.changePercent.toFixed(1)}% over the monitoring period.`,
            impact: 'medium',
            actionRequired: false
        })
    }

    if (trends.medicationCompliance.complianceRate < 80) {
        insights.push({
            type: 'concerning',
            title: 'Poor Medication Compliance',
            description: `Medication compliance is ${trends.medicationCompliance.complianceRate.toFixed(1)}%, which may impact treatment effectiveness.`,
            impact: 'high',
            actionRequired: true
        })
    }

    if (trends.alertFrequency.totalAlerts > 10) {
        insights.push({
            type: 'concerning',
            title: 'High Alert Frequency',
            description: `${trends.alertFrequency.totalAlerts} alerts generated in the monitoring period, indicating unstable condition.`,
            impact: 'high',
            actionRequired: true
        })
    }

    trends.symptomTrends.forEach(symptom => {
        if (symptom.trend === 'worsening' && symptom.averageScore > 7) {
            insights.push({
                type: 'concerning',
                title: `Worsening ${symptom.symptomName}`,
                description: `${symptom.symptomName} severity has increased with an average score of ${symptom.averageScore.toFixed(1)}/10.`,
                impact: 'medium',
                actionRequired: true
            })
        }
    })

    return insights
}

function generateRecommendations(
    insights: AnalyticsInsight[],
    trends: AnalyticsData['trends'],
    diseaseType: DiseaseType
): string[] {
    const recommendations: string[] = []

    insights.forEach(insight => {
        if (insight.actionRequired) {
            switch (insight.type) {
                case 'concerning':
                case 'critical':
                    if (insight.title.includes('Oxygen Saturation')) {
                        recommendations.push('Consider oxygen therapy assessment or adjustment')
                        recommendations.push('Schedule urgent pulmonary function evaluation')
                    }
                    if (insight.title.includes('Medication Compliance')) {
                        recommendations.push('Review medication regimen with patient')
                        recommendations.push('Consider medication adherence support tools')
                    }
                    if (insight.title.includes('Alert Frequency')) {
                        recommendations.push('Increase monitoring frequency')
                        recommendations.push('Consider treatment plan optimization')
                    }
                    break
            }
        }
    })

    switch (diseaseType) {
        case 'Asthma':
            if (trends.diseaseSpecificTrends.rescueInhalerUse?.averageUse > 2) {
                recommendations.push('Review asthma control - consider step-up therapy')
                recommendations.push('Ensure proper inhaler technique')
            }
            break
        case 'COPD':
            if (trends.diseaseSpecificTrends.sputumAnalysis?.colorDistribution?.green > 0) {
                recommendations.push('Monitor for COPD exacerbations')
                recommendations.push('Consider antibiotic therapy if infection suspected')
            }
            break
        case 'ILD':
            if (trends.diseaseSpecificTrends.oxygenDependency?.oxygenIncrease > 0) {
                recommendations.push('Evaluate for disease progression')
                recommendations.push('Consider antifibrotic therapy optimization')
            }
            break
    }

    return recommendations
}

function calculateTrend(values: number[]): 'improving' | 'stable' | 'declining' {
    if (values.length < 2) return 'stable'

    const firstHalf = values.slice(0, Math.floor(values.length / 2))
    const secondHalf = values.slice(Math.floor(values.length / 2))

    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length

    const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100

    if (changePercent > 5) return 'improving'
    if (changePercent < -5) return 'declining'
    return 'stable'
}

function getCommonPatientDataHistory(patientId: string, dateRange: { start: string; end: string }): CommonPatientData[] {

    return []
}

function getDiseaseSpecificDataHistory(patientId: string, diseaseType: DiseaseType, dateRange: { start: string; end: string }): any[] {

    return []
}

export function exportAnalyticsData(analyticsData: AnalyticsData, format: 'csv' | 'json' = 'json'): string {
    if (format === 'json') {
        return JSON.stringify(analyticsData, null, 2)
    }

    const headers = ['Date', 'SpO2', 'Alert Count', 'Medication Compliance']
    const rows: string[][] = []

    const maxLength = Math.max(
        analyticsData.trends.spo2Trend.dates.length,
        analyticsData.trends.alertFrequency.dates.length
    )

    for (let i = 0; i < maxLength; i++) {
        const row = [
            analyticsData.trends.spo2Trend.dates[i] || '',
            analyticsData.trends.spo2Trend.values[i]?.toString() || '',
            analyticsData.trends.alertFrequency.alertCounts[i]?.toString() || '0',
            i === 0 ? analyticsData.trends.medicationCompliance.complianceRate.toString() : ''
        ]
        rows.push(row)
    }

    return [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n')
}