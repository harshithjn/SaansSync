export declare function createPatient(payload: {
    email: string;
    password?: string;
    fullName: string;
    diseaseType: string;
    doctorId?: string;
    patientData?: any;
}): Promise<any>;
export declare function getPatientById(patientId: string): Promise<any>;
export declare function updatePatient(patientId: string, updates: {
    full_name?: string;
    patient_data?: any;
}): Promise<boolean>;
export declare function getPatientLogs(patientId: string): Promise<any[]>;
export declare function getPatientMedications(patientId: string): Promise<any>;
export declare function canLogToday(patientId: string): Promise<boolean>;
//# sourceMappingURL=patientService.d.ts.map