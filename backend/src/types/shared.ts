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
