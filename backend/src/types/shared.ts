// ============================================================
// SHARED TYPES FOR BACKEND (Daily Logs, Scoring, Alerts)
// ============================================================
// These types are duplicated from frontend to maintain separation of concerns
// and allow backend to compile independently

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
