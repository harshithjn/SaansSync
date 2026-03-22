export declare function createPatient(payload: {
    email: string;
    password?: string;
    fullName: string;
    diseaseType: string;
    doctorId?: string;
    patientData?: any;
}): Promise<{
    id: string;
    authUserId: string | null;
    email: string;
    fullName: string;
    password: string | null;
    createdAt: Date;
    updatedAt: Date;
    doctorId: string | null;
    diseaseType: string;
    patientData: import("@prisma/client/runtime/library").JsonValue | null;
    defaultPassword: string | null;
}>;
export declare function getPatientById(patientId: string): Promise<any>;
export declare function updatePatient(patientId: string, updates: {
    full_name?: string;
    patient_data?: any;
}): Promise<boolean>;
export declare function getPatientLogs(patientId: string): Promise<any[]>;
export declare function getPatientMedications(patientId: string): Promise<any>;
export declare function getPatientReports(patientId: string): Promise<{
    pftRecords: any;
    reports: any;
}>;
export declare function canLogToday(patientId: string): Promise<boolean>;
export declare function getPatientInstructions(patientId: string): Promise<{
    id: string;
    createdAt: Date;
    doctorId: string | null;
    patientId: string;
    instruction: string;
    isActive: boolean | null;
}[]>;
export declare function addPatientInstruction(patientId: string, doctorId: string, instruction: string): Promise<{
    id: string;
    createdAt: Date;
    doctorId: string | null;
    patientId: string;
    instruction: string;
    isActive: boolean | null;
}>;
//# sourceMappingURL=patientService.d.ts.map