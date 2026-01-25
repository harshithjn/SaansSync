// Primary Diagnosis Categories
export const PRIMARY_DIAGNOSIS_CATEGORIES = [
    "Interstitial Lung Disease (ILD)",
    "Obstructive Airway Disease (OAD)",
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
    "Eosinophilic pneumonia"
]

export const OAD_SUBTYPES = [
    "COPD",
    "Asthma",
    "Asthma-COPD Overlap (ACO)",
    "Bronchiolitis Obliterans",
    "Other OAD"
]

export const BRONCHIECTASIS_SUBTYPES = [
    "Post-infectious",
    "Cystic Fibrosis related",
    "ABPA related",
    "Primary Ciliary Dyskinesia",
    "Idiopathic",
    "Other"
]

export const POST_ICU_SUBTYPES = [
    "ARDS recovery",
    "Sepsis recovery",
    "COVID ICU recovery",
    "Post ventilation lung injury",
    "Post surgical ICU recovery",
    "Neuromuscular ICU recovery",
    "Other Post ICU conditions"
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
    "Past Pulmonary TB"
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
}

// Types
export interface PatientData {
    // Step 1: Basic Information (Updated)
    fullName: string
    mobileNumber: string
    emailId: string
    age: string
    sex: string
    registrationDate: string

    // Step 2: Diagnosis & Medical History (Updated)
    diagnosis: StructuredDiagnosis
    dateOfDiagnosis: string
    medicalHistory: string
    comorbidities: string[]
    occupationalExposure: string
    familyHistory: string
    additionalNotes: string
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
}

export interface Medication {
    id: string
    route: string
    drugName: string
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

export interface ValidationError {
    field: string
    message: string
}

export interface StepValidation {
    isValid: boolean
    errors: ValidationError[]
}