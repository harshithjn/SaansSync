// Primary Diagnosis Categories
export const PRIMARY_DIAGNOSIS_CATEGORIES = [
    "Interstitial Lung Disease (ILD)",
    "Bronchial Asthma",
    "COPD (Chronic Obstructive Pulmonary Disease)",
    "Bronchiectasis",
    "Post ICU Recovery"
]

// Disease Classification Constants
export const ILD_SUBTYPES = [
    "Idiopathic pulmonary fibrosis",
    "Hypersensitivity pneumonitis",
    "Idiopathic NSIP",
    "CTD-ILD",
    "IPAF",
    "Sarcoidosis",
    "Occupational ILD",
    "COP",
    "RB-ILD",
    "DIP",
    "AIP",
    "Idiopathic pleuro-parenchymal fibroelastosis",
    "LIP",
    "LCH",
    "LAM",
    "Eosinophilic pneumonia",
    "Others"
]

export const OAD_SUBTYPES = [
    "Mild persistent asthma",
    "Moderate persistent asthma",
    "Severe persistent asthma",
    "Asthma-COPD Overlap (ACO)",
    "Others"
]

export const COPD_SUBTYPES = [
    "Mild COPD",
    "Moderate COPD",
    "Severe COPD",
    "Very severe COPD",
    "Asthma-COPD Overlap (ACO)",
    "Others"
]

export const BRONCHIECTASIS_SUBTYPES = [
    "Post-infectious",
    "Post tubercular",
    "Cystic Fibrosis related",
    "ABPA related",
    "Primary Ciliary Dyskinesia",
    "Idiopathic",
    "Others"
]

export const POST_ICU_SUBTYPES = [
    "Asthma",
    "COPD",
    "ILD",
    "Bronchiectasis",
    "Post-infection recovery",
    "ARDS recovery",
    "Sepsis recovery",
    "COVID ICU recovery",
    "Post ventilation lung injury",
    "Post surgical ICU recovery",
    "Neuromuscular ICU recovery",
    "Others"
]

export const CTD_TYPES = [
    "Scleroderma",
    "Rheumatoid arthritis",
    "SLE",
    "Dermatomyositis",
    "Polymyositis",
    "MCTD",
    "Others"
]

export const SARCOIDOSIS_STAGES = [
    "Stage 1",
    "Stage 2",
    "Stage 3",
    "Stage 4"
]

export const CO_MORBIDITIES_LIST = [
    "Diabetes Mellitus",
    "Hypertension",
    "Coronary Artery Disease",
    "Heart Failure",
    "Atrial Fibrillation",
    "GERD (Gastroesophageal Reflux Disease)",
    "Obstructive Sleep Apnea",
    "Chronic Kidney Disease",
    "Osteoporosis",
    "Depression/Anxiety",
    "Pulmonary Hypertension",
    "Venous Thromboembolism",
    "Past Pulmonary TB",
    "ABPA (Allergic Bronchopulmonary Aspergillosis)",
    "CCPA (Chronic Cavitary Pulmonary Aspergillosis)",
    "Allergic Rhinitis",
    "Hepatitis A",
    "Hepatitis B",
    "Hepatitis C",
    "HIV",
    "Cor Pulmonale",
    "Others"
]

export const ROUTE_OPTIONS = [
    "Oral",
    "Intravenous",
    "Intramuscular",
    "Subcutaneous",
    "Inhalation",
    "Nebulization",
    "Topical",
    "Sublingual",
    "Rectal"
]

export const FREQUENCY_LIST = [
    "Once daily (OD)",
    "Twice daily (BD)",
    "Three times daily (TDS)",
    "Four times daily (QDS)",
    "Every 6 hours",
    "Every 8 hours",
    "Every 12 hours",
    "As needed (PRN)",
    "Weekly",
    "Monthly",
    "Stat (Single dose)"
]

// Medication Drug Name Options
export const DRUG_NAME_OPTIONS = [
    "Myxolone",
    "MMF (Mycophenolate Mofetil)",
    "Azathioprine",
    "Methotrexate",
    "Rituximab",
    "Nintedanib",
    "Pirfenidone",
    "Bronchodilator",
    "IVIG",
    "Other"
]

// PFT Normal Ranges
export const PFT_RANGES = {
    FVC: { min: 80, max: 120, unit: "% predicted" },
    FEV1: { min: 80, max: 120, unit: "% predicted" },
    DLCO: { min: 80, max: 120, unit: "% predicted" },
    "6MWD": { min: 400, max: 700, unit: "meters" },
    "Min SpO2": { min: 88, max: 100, unit: "%" },
    "Max SpO2": { min: 95, max: 100, unit: "%" }
}

// Structured Diagnosis Interface
export interface StructuredDiagnosis {
    primaryCategory: string
    subtype: string
    ctdType?: string
    sarcoidosisStage?: string
    fibroticiLD?: string  // For ILD: "Yes" or "No"
    customSubtype?: string // For "Others" option with free text
}

// Types
export interface PatientData {
    // Step 1: Basic Information (Updated)
    fullName: string
    emailId: string
    age: string
    sex: string
    registrationDate: string

    // Step 2: Diagnosis & Medical History (Updated)
    diagnosis: StructuredDiagnosis
    medicalHistory: string
    comorbidities: string[]
    customComorbidity: string
    occupationalExposure: string
    smokingStatus: string
    packYears: string

    // Step 3: Medications
    medications: Medication[]

    // Step 4: PFT Records
    pftRecords: PFTRecord[]

    // Step 5: Respiratory Support
    requiresRespiratorySupport: string
    ltot: LTOTConfig
    bipap: BiPAPConfig
    invasiveVentilation: InvasiveVentilationConfig
    tracheostomy: TracheostomyConfig

    // Patient Vitals (for patient dashboard)
    vitals?: PatientVitals

    // Additional Notes
    additionalNotes?: string
}

export interface Medication {
    id: string
    route: string
    drugName: string
    customDrugName?: string
    dose: string
    frequency: string
    startDate: string
    endDate: string
    isActive: boolean
}

export interface PFTRecord {
    id: string
    // Spirometry
    fvc: string
    fev1: string
    fvcLitres: string  // FVC in litres - numeric input
    fev1Litres: string // FEV1 in litres - numeric input
    // Diffusion
    dlco: string
    // Exercise
    sixMWD: string
    minSpO2: string
    maxSpO2: string
    testDate: string
}

export interface LTOTConfig {
    enabled: boolean
    oxygenLitres: string
}

export interface BiPAPConfig {
    enabled: boolean
    overnightUse: boolean
    allTimeUse: boolean
    requiresOxygen: boolean
    oxygenLitres: string
    ipap: string
    epap: string
    pressureSupport: string
    respiratoryRate: string
}

export interface InvasiveVentilationConfig {
    enabled: boolean
    ipap: string
    epap: string
    pressureSupport: string
    respiratoryRate: string
    fiO2: string
}

export interface TracheostomyConfig {
    enabled: boolean
    airwayPatencyRequired: boolean
    oxygenViaTrach: boolean
    oxygenLitres: string
    requiresVentilator: boolean
    ipap: string
    epap: string
    pressureSupport: string
    respiratoryRate: string
    tidalVolume: string
    fiO2: string
}

// Patient Vitals and Respiratory Status (for patient dashboard)
export interface PatientVitals {
    spo2: string
    respiratoryStatus: {
        isStatic: boolean
        hasWorsening: boolean
        hasImprovement: boolean
        oxygenIncreaseAmount: string
        oxygenDecreaseAmount: string
        baselineOxygen: string
        lastUpdated: string
    }
}

export interface ValidationError {
    field: string
    message: string
}

export interface StepValidation {
    isValid: boolean
    errors: ValidationError[]
}

// Prescription Types
export interface Prescription {
    id: string
    patientId: string
    doctorId: string
    patientName: string
    doctorName: string
    date: string
    medications: PrescriptionMedication[]
    personalizedAlerts: PersonalizedAlert[]
    diagnosis: string
    instructions?: string
}

export interface PrescriptionMedication {
    drugName: string
    dose: string
    frequency: string
    route?: string
    duration?: string
    instructions?: string
}

export interface PersonalizedAlert {
    id: string
    type: 'pulmonary-rehabilitation' | 'chest-physiotherapy' | 'suctioning' | 'custom'
    name: string
    frequency: string // "1 time a day", "2 times a day", etc.
    interval?: string // "every 6 hours", "every 4 hours", etc.
    instructions?: string
    isActive: boolean
}

// Alert frequency options
export const PERSONALIZED_ALERT_TYPES = [
    {
        type: 'pulmonary-rehabilitation',
        name: 'Pulmonary Rehabilitation',
        frequencies: ['1 time a day', '2 times a day']
    },
    {
        type: 'chest-physiotherapy',
        name: 'Chest Physiotherapy',
        frequencies: ['1 time', '2 times', '3 times', '4 times'],
        intervals: ['every 6 hours', 'every 4 hours']
    },
    {
        type: 'suctioning',
        name: 'Suctioning',
        frequencies: ['1 time', '2 times', '3 times', '4 times'],
        intervals: ['every 6 hours', 'every 4 hours']
    },
    {
        type: 'custom',
        name: 'Custom Alert',
        frequencies: ['1 time a day', '2 times a day', '3 times a day', '4 times a day'],
        intervals: ['every 6 hours', 'every 4 hours', 'every 8 hours', 'every 12 hours']
    }
]

// ============================================================
// DAILY LOG TYPES & DASHBOARD INTERFACES
// ============================================================

export interface DailyLogCommon {
    logDate: string; // ISO Date
    aqi: {
        pm25: number;
        pm10: number;
        status: string; // 'Good' | 'Poor' | 'Hazardous' etc
    };
    spo2: {
        atRest: number;
        onExertion: number;
    };
    oxygenRequirement: {
        status: 'Static' | 'Increased' | 'Decreased';
        delta?: number; // Litres
    };
    mMRCScore: string | number; // 0-4
    medicationAdherence: {
        medicationId: string; // ID from PatientData.medications
        taken: boolean;
        name?: string; // Optional for display
    }[];
    sideEffects: {
        type: string;
        description?: string;
    }[];
    symptoms: {
        vasScore: number; // 0-10
        previousVasScore?: number;
        hasPedalEdema: boolean;
        others?: string;
    };
}

// Disease Specific Logs

export type AsthmaControlStatus = 'Well controlled' | 'Partly controlled' | 'Poorly controlled';

export interface AsthmaSpecificLog {
    control: {
        daytimeSymptoms: boolean;
        nightWaking: boolean;
        relieverUse: boolean;
        activityLimitation: boolean;
        classification?: AsthmaControlStatus; // Computed
    };
    daily: {
        rescuePuffs: number;
        pefr: number;
    };
}

export interface COPDSpecificLog {
    symptoms: {
        coughFrequency: number; // 0-4
        phlegmProduction: number; // 0-4
        exerciseTolerance: boolean; // Yes/No (Limited?)
        sleepDisturbance: boolean; // Yes/No
    };
    daily: {
        energyVas: number; // 0-10
        chestTightnessVas: number; // 0-10
        stepCount?: number;
    };
}

export interface BronchiectasisSpecificLog {
    sputum: {
        volume: 'None' | 'Small' | 'Moderate' | 'Large';
        color: 'White' | 'Pale Yellow' | 'Green' | 'Red/Rusty';
    };
    clearanceEase: number; // 1-5
    infectionScreen: {
        fever: boolean;
        malaise: boolean;
    };
}

// Post-ICU reuses Bronchiectasis structure as per requirements
export type PostICUSpecificLog = BronchiectasisSpecificLog;

export interface ILDSpecificLog {
    dryCoughFrequencyChange: number; // 0-4 or scale
    breathlessnessAtRest: number; // VAS or scale? Assuming similar to mMRC or VAS
    kbildScore?: number;
    // SpO2 trends are derived from common section
}

export interface DailyLogSubmission {
    patientId: string;
    diseaseType: string; // "Bronchial Asthma", "COPD", etc.
    common: DailyLogCommon;
    specific: AsthmaSpecificLog | COPDSpecificLog | BronchiectasisSpecificLog | ILDSpecificLog;
}

// Alerts

export type AlertLevel = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';

export interface Alert {
    id: string;
    patientId: string;
    doctorId?: string;
    date: string; // ISO
    score: number; // 0-10
    level: AlertLevel;
    drivers: string[];
    diseaseType: string;
    acknowledged: boolean;
    acknowledgedAt?: string;
}

export interface ScoreResult {
    score: number;
    riskLevel: AlertLevel;
    drivers: string[];
}
