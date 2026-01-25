import { PatientData, ValidationError, StepValidation, Medication, PFTRecord, PFT_RANGES } from './patient-types'

export const validateStep1 = (data: PatientData): StepValidation => {
    const errors: ValidationError[] = []

    if (!data.fullName.trim()) {
        errors.push({ field: 'fullName', message: 'Full name is required' })
    }

    const mobileDigits = data.mobileNumber.replace(/\D/g, '')
    if (mobileDigits.length < 10) {
        errors.push({ field: 'mobileNumber', message: 'Mobile number must contain at least 10 digits' })
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!data.emailId.trim()) {
        errors.push({ field: 'emailId', message: 'Email ID is required' })
    } else if (!emailRegex.test(data.emailId)) {
        errors.push({ field: 'emailId', message: 'Please enter a valid email address' })
    }

    const age = parseInt(data.age)
    if (!data.age || isNaN(age) || age <= 0) {
        errors.push({ field: 'age', message: 'Age must be a positive number' })
    }

    if (!data.sex) {
        errors.push({ field: 'sex', message: 'Sex is required' })
    }

    return {
        isValid: errors.length === 0,
        errors
    }
}

export const validateStep2 = (data: PatientData): StepValidation => {
    const errors: ValidationError[] = []

    if (!data.diagnosis.primaryCategory) {
        errors.push({ field: 'primaryCategory', message: 'Primary diagnosis category is required' })
    }

    if (!data.diagnosis.subtype) {
        errors.push({ field: 'subtype', message: 'Diagnosis subtype is required' })
    }

    // Conditional validation for CTD-ILD
    if (data.diagnosis.subtype === 'CTD-ILD' && !data.diagnosis.ctdType) {
        errors.push({ field: 'ctdType', message: 'CTD type is required when subtype is CTD-ILD' })
    }

    // Conditional validation for Sarcoidosis
    if (data.diagnosis.subtype === 'Sarcoidosis' && !data.diagnosis.sarcoidosisStage) {
        errors.push({ field: 'sarcoidosisStage', message: 'Sarcoidosis stage is required when subtype is Sarcoidosis' })
    }

    if (!data.dateOfDiagnosis) {
        errors.push({ field: 'dateOfDiagnosis', message: 'Date of diagnosis is required' })
    }

    if (data.smokingStatus !== 'Never Smoked' && data.smokingStatus !== '') {
        const packYears = parseFloat(data.packYears)
        if (data.packYears && (isNaN(packYears) || packYears < 0)) {
            errors.push({ field: 'packYears', message: 'Pack years must be a positive number' })
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    }
}

export const validateMedications = (medications: Medication[]): ValidationError[] => {
    const errors: ValidationError[] = []

    medications.forEach((med, index) => {
        if (!med.route) {
            errors.push({ field: `medication-${index}-route`, message: `Medication ${index + 1}: Route is required` })
        }
        if (!med.drugName.trim()) {
            errors.push({ field: `medication-${index}-drugName`, message: `Medication ${index + 1}: Drug name is required` })
        }
        if (!med.dose.trim()) {
            errors.push({ field: `medication-${index}-dose`, message: `Medication ${index + 1}: Dose is required` })
        }
        if (!med.frequency) {
            errors.push({ field: `medication-${index}-frequency`, message: `Medication ${index + 1}: Frequency is required` })
        }
        if (!med.startDate) {
            errors.push({ field: `medication-${index}-startDate`, message: `Medication ${index + 1}: Start date is required` })
        } else {
            const startDate = new Date(med.startDate)
            const today = new Date()
            if (startDate > today) {
                errors.push({ field: `medication-${index}-startDate`, message: `Medication ${index + 1}: Start date cannot be in the future` })
            }
        }
    })

    return errors
}

export const validateStep3 = (data: PatientData): StepValidation => {
    const errors = validateMedications(data.medications)

    return {
        isValid: errors.length === 0,
        errors
    }
}

export const validatePFTRecord = (record: PFTRecord, index: number): ValidationError[] => {
    const errors: ValidationError[] = []

    // Validate numeric ranges for entered values
    Object.entries(PFT_RANGES).forEach(([key, range]) => {
        const fieldMap: { [key: string]: string } = {
            'FVC': record.fvc,
            'FEV1': record.fev1,
            'DLCO': record.dlco,
            '6MWD': record.sixMWD,
            'Min SpO2': record.minSpO2,
            'Max SpO2': record.maxSpO2
        }

        const value = fieldMap[key]
        if (value && value.trim() !== '') {
            const numValue = parseFloat(value)
            if (isNaN(numValue)) {
                errors.push({
                    field: `pft-${index}-${key.toLowerCase().replace(/\s/g, '')}`,
                    message: `Record ${index + 1}: ${key} must be a valid number`
                })
            }
        }
    })

    return errors
}

export const validateStep4 = (data: PatientData): StepValidation => {
    const errors: ValidationError[] = []

    data.pftRecords.forEach((record, index) => {
        const recordErrors = validatePFTRecord(record, index)
        errors.push(...recordErrors)
    })

    return {
        isValid: errors.length === 0,
        errors
    }
}

export const isValueAbnormal = (key: string, value: string): boolean => {
    if (!value || value.trim() === '') return false

    const numValue = parseFloat(value)
    if (isNaN(numValue)) return false

    const range = PFT_RANGES[key as keyof typeof PFT_RANGES]
    if (!range) return false

    return numValue < range.min || numValue > range.max
}

export const formatMobileNumber = (input: string): string => {
    const digits = input.replace(/\D/g, '')
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`
    if (digits.length <= 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`
}

export const extractDigits = (input: string): string => {
    return input.replace(/\D/g, '')
}