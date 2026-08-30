import { DiseaseType, RedFlagScore, AlertLevel, CommonPatientData, AsthmaData, COPDData, BronchiectasisData, ILDData, PostInfectionData } from './monitoring-types'

interface PatientScoringData {
    patientId: string
    diagnosis: DiseaseType
    spo2: number
    spo2BaselineDrop?: number
    respiratoryRate?: number
    hasHemoptysis: boolean
    mMRCIncrease: boolean
    medCompliance: boolean
    vasSymptomScore: number
    aqi: number

    diseaseData: AsthmaData | COPDData | BronchiectasisData | ILDData | PostInfectionData
}

export function calculateRedFlagScore(patientData: PatientScoringData): RedFlagScore {
    let points = 0
    const factors: string[] = []
    const { diagnosis, spo2, hasHemoptysis, respiratoryRate = 0 } = patientData

    if (spo2 < 85) {
        return {
            patientId: patientData.patientId,
            score: 10,
            level: 'critical',
            factors: ['Critical SpO2 < 85%'],
            calculatedAt: new Date().toISOString(),
            diseaseSpecificFactors: {}
        }
    }

    if (hasHemoptysis) {
        return {
            patientId: patientData.patientId,
            score: 10,
            level: 'critical',
            factors: ['Blood in sputum (Hemoptysis)'],
            calculatedAt: new Date().toISOString(),
            diseaseSpecificFactors: {}
        }
    }

    if (respiratoryRate > 30) {
        return {
            patientId: patientData.patientId,
            score: 10,
            level: 'critical',
            factors: ['Rapid breathing (>30/min)'],
            calculatedAt: new Date().toISOString(),
            diseaseSpecificFactors: {}
        }
    }

    if (spo2 >= 89 && spo2 <= 91) {
        points += 4
        factors.push('SpO2 89-91%')
    } else if (spo2 <= 88) {
        points += 6
        factors.push('SpO2 ≤88%')
    }

    if (patientData.mMRCIncrease) {
        points += 2
        factors.push('mMRC scale increased')
    }

    if (!patientData.medCompliance) {
        points += 1
        factors.push('Missed maintenance medication')
    }

    if (patientData.vasSymptomScore > 7) {
        points += 2
        factors.push('High symptom severity (VAS >7)')
    }

    if (patientData.aqi > 200) {
        points += 1
        factors.push('Poor air quality (AQI >200)')
    }

    const diseaseFactors = calculateDiseaseSpecificPoints(diagnosis, patientData.diseaseData)
    points += diseaseFactors.points
    factors.push(...diseaseFactors.factors)

    const finalScore = Math.min(1 + points, 10)
    const level = determineAlertLevel(finalScore)

    return {
        patientId: patientData.patientId,
        score: finalScore,
        level,
        factors,
        calculatedAt: new Date().toISOString(),
        diseaseSpecificFactors: diseaseFactors.specificData
    }
}

function calculateDiseaseSpecificPoints(diagnosis: DiseaseType, diseaseData: any): {
    points: number
    factors: string[]
    specificData: any
} {
    let points = 0
    const factors: string[] = []
    let specificData = {}

    switch (diagnosis) {
        case 'Asthma':
            const asthmaData = diseaseData as AsthmaData
            specificData = {
                peakFlowPercent: asthmaData.peakFlowPercent,
                nightWaking: asthmaData.nightWaking,
                rescuePuffs: asthmaData.rescueInhalerPuffs,
                controlLevel: asthmaData.controlLevel
            }

            if (asthmaData.peakFlowPercent && asthmaData.peakFlowPercent < 60) {
                return { points: 8, factors: ['Peak flow <60% of personal best (Auto-9)'], specificData }
            }

            if (asthmaData.nightWaking) {
                points += 3
                factors.push('Night waking due to symptoms (+3)')
            }

            if (asthmaData.rescueInhalerPuffs > 4) {
                points += 3
                factors.push('Excessive rescue inhaler use >4 puffs (+3)')
            }
            break

        case 'COPD':
            const copdData = diseaseData as COPDData
            specificData = {
                sputumColor: copdData.sputumColor,
                fever: copdData.fever,
                sputumVolume: copdData.sputumVolume,
                chestHeaviness: copdData.chestHeaviness
            }

            if (copdData.sputumColor === 'dark-green' || copdData.sputumColor === 'yellow') {
                points += 3
                factors.push('Purulent sputum (infection signs) (+3)')
            }

            if (copdData.fever) {
                points += 4
                factors.push('Fever >38°C (+4)')
            }

            if (copdData.sputumVolume === 'large') {
                points += 2
                factors.push('Increased sputum volume (+2)')
            }

            if (copdData.chestHeaviness > 7) {
                points += 2
                factors.push('Severe chest heaviness >7 (+2)')
            }
            break

        case 'Bronchiectasis':
            const bronchData = diseaseData as BronchiectasisData
            specificData = {
                sputumColor: bronchData.sputumColor,
                malaise: bronchData.malaise,
                sputumVolume: bronchData.sputumVolume,
                fever: bronchData.fever
            }

            if (bronchData.sputumColor === 'dark-green') {
                points += 4
                factors.push('Green/purulent sputum (+4)')
            }

            if (bronchData.malaise) {
                points += 2
                factors.push('Flu-like symptoms/malaise (+2)')
            }

            if (bronchData.sputumVolume === 'large') {
                points += 2
                factors.push('Large sputum volume (+2)')
            }
            break

        case 'ILD':
            const ildData = diseaseData as ILDData
            specificData = {
                spo2BaselineDrop: ildData.spo2BaselineDrop,
                dryCoughIncrease: ildData.dryCoughSeverity > 7,
                breathlessAtRest: ildData.breathlessnessChange === 'worse',
                newChestPain: ildData.newChestPain
            }

            if (ildData.spo2BaselineDrop >= 4) {
                points += 5
                factors.push('SpO2 drop ≥4% from baseline (+5)')
            }

            if (ildData.dryCoughSeverity > 7) {
                points += 3
                factors.push('Severe dry cough increase (+3)')
            }

            if (ildData.breathlessnessChange === 'worse') {
                points += 4
                factors.push('Worsening breathlessness at rest (+4)')
            }
            break

        case 'Post-Infection':
            const postInfData = diseaseData as PostInfectionData
            specificData = {
                persistentCough: postInfData.persistentCough,
                hemoptysis: postInfData.hemoptysis,
                sputumColor: postInfData.sputumColor
            }

            const bronchResult = calculateDiseaseSpecificPoints('Bronchiectasis', postInfData)
            points += bronchResult.points
            factors.push(...bronchResult.factors)

            if (postInfData.persistentCough) {
                points += 2
                factors.push('Persistent cough >3 weeks (+2)')
            }
            break
    }

    return { points, factors, specificData }
}

function determineAlertLevel(score: number): AlertLevel {
    if (score >= 9) return 'critical'
    if (score >= 7) return 'high'
    if (score >= 4) return 'moderate'
    return 'low'
}

export function getFolderColor(score: number): 'green' | 'yellow' | 'red' {
    if (score >= 7) return 'red'
    if (score >= 4) return 'yellow'
    return 'green'
}

export function getScoreDescription(score: number): string {
    if (score >= 9) return 'Critical - Immediate attention required'
    if (score >= 7) return 'High Risk - Doctor notification needed'
    if (score >= 4) return 'Moderate Risk - Monitor closely'
    return 'Low Risk - Routine monitoring'
}

export function calculateAsthmaControl(data: AsthmaData): 'well-controlled' | 'partly-controlled' | 'uncontrolled' {
    let yesCount = 0
    if (data.daytimeSymptoms) yesCount++
    if (data.nightWaking) yesCount++
    if (data.relieverUse) yesCount++
    if (data.activityLimitation) yesCount++

    if (yesCount === 0) return 'well-controlled'
    if (yesCount <= 2) return 'partly-controlled'
    return 'uncontrolled'
}