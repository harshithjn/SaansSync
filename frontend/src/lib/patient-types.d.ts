export declare const PRIMARY_DIAGNOSIS_CATEGORIES: string[];
export declare const ILD_SUBTYPES: string[];
export declare const OAD_SUBTYPES: string[];
export declare const COPD_SUBTYPES: string[];
export declare const BRONCHIECTASIS_SUBTYPES: string[];
export declare const POST_ICU_SUBTYPES: string[];
export declare const CTD_TYPES: string[];
export declare const SARCOIDOSIS_STAGES: string[];
export declare const CO_MORBIDITIES_LIST: string[];
export declare const ROUTE_OPTIONS: string[];
export declare const FREQUENCY_LIST: string[];
export declare const DRUG_NAME_OPTIONS: string[];
export declare const PFT_RANGES: {
    FVC: {
        min: number;
        max: number;
        unit: string;
    };
    FEV1: {
        min: number;
        max: number;
        unit: string;
    };
    DLCO: {
        min: number;
        max: number;
        unit: string;
    };
    "6MWD": {
        min: number;
        max: number;
        unit: string;
    };
    "Min SpO2": {
        min: number;
        max: number;
        unit: string;
    };
    "Max SpO2": {
        min: number;
        max: number;
        unit: string;
    };
};
export interface StructuredDiagnosis {
    primaryCategory: string;
    subtype: string;
    ctdType?: string;
    sarcoidosisStage?: string;
    fibroticiLD?: string;
    customSubtype?: string;
}
export interface PatientData {
    fullName: string;
    emailId: string;
    age: string;
    sex: string;
    registrationDate: string;
    diagnosis: StructuredDiagnosis;
    medicalHistory: string;
    comorbidities: string[];
    customComorbidity: string;
    occupationalExposure: string;
    smokingStatus: string;
    packYears: string;
    medications: Medication[];
    pftRecords: PFTRecord[];
    requiresRespiratorySupport: string;
    ltot: LTOTConfig;
    bipap: BiPAPConfig;
    invasiveVentilation: InvasiveVentilationConfig;
    tracheostomy: TracheostomyConfig;
    vitals?: PatientVitals;
    additionalNotes?: string;
}
export interface Medication {
    id: string;
    route: string;
    drugName: string;
    customDrugName?: string;
    dose: string;
    frequency: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
}
export interface PFTRecord {
    id: string;
    fvc: string;
    fev1: string;
    fvcLitres: string;
    fev1Litres: string;
    dlco: string;
    sixMWD: string;
    minSpO2: string;
    maxSpO2: string;
    testDate: string;
}
export interface LTOTConfig {
    enabled: boolean;
    oxygenLitres: string;
}
export interface BiPAPConfig {
    enabled: boolean;
    overnightUse: boolean;
    allTimeUse: boolean;
    requiresOxygen: boolean;
    oxygenLitres: string;
    ipap: string;
    epap: string;
    pressureSupport: string;
    respiratoryRate: string;
}
export interface InvasiveVentilationConfig {
    enabled: boolean;
    ipap: string;
    epap: string;
    pressureSupport: string;
    respiratoryRate: string;
    fiO2: string;
}
export interface TracheostomyConfig {
    enabled: boolean;
    airwayPatencyRequired: boolean;
    oxygenViaTrach: boolean;
    oxygenLitres: string;
    requiresVentilator: boolean;
    ipap: string;
    epap: string;
    pressureSupport: string;
    respiratoryRate: string;
    tidalVolume: string;
    fiO2: string;
}
export interface PatientVitals {
    spo2: string;
    respiratoryStatus: {
        isStatic: boolean;
        hasWorsening: boolean;
        hasImprovement: boolean;
        oxygenIncreaseAmount: string;
        oxygenDecreaseAmount: string;
        baselineOxygen: string;
        lastUpdated: string;
    };
}
export interface ValidationError {
    field: string;
    message: string;
}
export interface StepValidation {
    isValid: boolean;
    errors: ValidationError[];
}
export interface Prescription {
    id: string;
    patientId: string;
    doctorId: string;
    patientName: string;
    doctorName: string;
    date: string;
    medications: PrescriptionMedication[];
    personalizedAlerts: PersonalizedAlert[];
    diagnosis: string;
    instructions?: string;
}
export interface PrescriptionMedication {
    drugName: string;
    dose: string;
    frequency: string;
    duration?: string;
    instructions?: string;
}
export interface PersonalizedAlert {
    id: string;
    type: 'pulmonary-rehabilitation' | 'chest-physiotherapy' | 'suctioning' | 'custom';
    name: string;
    frequency: string;
    interval?: string;
    instructions?: string;
    isActive: boolean;
}
export declare const PERSONALIZED_ALERT_TYPES: ({
    type: string;
    name: string;
    frequencies: string[];
    intervals?: undefined;
} | {
    type: string;
    name: string;
    frequencies: string[];
    intervals: string[];
})[];
export interface DailyLogCommon {
    logDate: string;
    aqi: {
        pm25: number;
        pm10: number;
        status: string;
    };
    spo2: {
        atRest: number;
        onExertion: number;
    };
    oxygenRequirement: {
        status: 'Static' | 'Increased' | 'Decreased';
        delta?: number;
    };
    mMRCScore: string | number;
    medicationAdherence: {
        medicationId: string;
        taken: boolean;
        name?: string;
    }[];
    sideEffects: {
        type: string;
        description?: string;
    }[];
    symptoms: {
        vasScore: number;
        previousVasScore?: number;
        hasPedalEdema: boolean;
        others?: string;
    };
}
export type AsthmaControlStatus = 'Well controlled' | 'Partly controlled' | 'Poorly controlled';
export interface AsthmaSpecificLog {
    control: {
        daytimeSymptoms: boolean;
        nightWaking: boolean;
        relieverUse: boolean;
        activityLimitation: boolean;
        classification?: AsthmaControlStatus;
    };
    daily: {
        rescuePuffs: number;
        pefr: number;
    };
}
export interface COPDSpecificLog {
    symptoms: {
        coughFrequency: number;
        phlegmProduction: number;
        exerciseTolerance: boolean;
        sleepDisturbance: boolean;
    };
    daily: {
        energyVas: number;
        chestTightnessVas: number;
        stepCount?: number;
    };
}
export interface BronchiectasisSpecificLog {
    sputum: {
        volume: 'None' | 'Small' | 'Moderate' | 'Large';
        color: 'White' | 'Pale Yellow' | 'Green' | 'Red/Rusty';
    };
    clearanceEase: number;
    infectionScreen: {
        fever: boolean;
        malaise: boolean;
    };
}
export type PostICUSpecificLog = BronchiectasisSpecificLog;
export interface ILDSpecificLog {
    dryCoughFrequencyChange: number;
    breathlessnessAtRest: number;
    kbildScore?: number;
}
export interface DailyLogSubmission {
    patientId: string;
    diseaseType: string;
    common: DailyLogCommon;
    specific: AsthmaSpecificLog | COPDSpecificLog | BronchiectasisSpecificLog | ILDSpecificLog;
}
export type AlertLevel = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
export interface Alert {
    id: string;
    patientId: string;
    doctorId?: string;
    date: string;
    score: number;
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
//# sourceMappingURL=patient-types.d.ts.map