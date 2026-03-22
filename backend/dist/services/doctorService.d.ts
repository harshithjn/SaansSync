export declare function createDoctorProfile(userId: string, payload: {
    fullName: string;
    email?: string;
}): Promise<{
    id: string;
    authUserId: string | null;
    email: string;
    fullName: string;
    approvalStatus: string;
    password: string | null;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function getDoctorProfile(doctorId: string): Promise<{
    id: string;
    authUserId: string | null;
    email: string;
    fullName: string;
    approvalStatus: string;
    password: string | null;
    createdAt: Date;
    updatedAt: Date;
} | null>;
export declare function getDoctorPatients(doctorId: string): Promise<{
    disease_type: any;
    id: string;
    email: string;
    fullName: string;
    createdAt: Date;
    doctorId: string | null;
    diseaseType: string;
    patientData: import("@prisma/client/runtime/library").JsonValue;
}[]>;
export declare function getDoctorLogs(doctorId: string): Promise<{
    patient_name: string;
    patient_disease: any;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    diseaseType: string;
    patientId: string;
    logDate: Date;
    diseaseData: import("@prisma/client/runtime/library").JsonValue;
    redFlagScore: import("@prisma/client/runtime/library").Decimal | null;
}[]>;
export declare function getDoctorAlerts(doctorId: string): Promise<{
    type: string;
    red_flag_score: number;
    id: string;
    createdAt: Date;
    doctorId: string | null;
    diseaseType: string;
    patientId: string;
    level: string;
    score: import("@prisma/client/runtime/library").Decimal;
    reasonText: string;
    alertData: import("@prisma/client/runtime/library").JsonValue | null;
    acknowledged: boolean | null;
    acknowledgedAt: Date | null;
}[]>;
export declare function assignPatientToDoctor(doctorId: string, patientId: string, diseaseType?: string): Promise<boolean>;
export declare function upsertPatientFolder(payload: {
    patientId: string;
    doctorId: string;
    fullName: string;
    age: number;
    diseaseType: string;
    lastLogDate: string;
    folderColor: string;
    redFlagScore: number;
    alertCount: number;
}): Promise<{
    id: string;
    fullName: string;
    updatedAt: Date;
    doctorId: string;
    diseaseType: string;
    patientId: string;
    redFlagScore: import("@prisma/client/runtime/library").Decimal | null;
    age: number | null;
    folderColor: string;
    alertCount: number | null;
    lastLogDate: Date | null;
} | null>;
export declare function getPatientFolders(doctorId: string): Promise<{
    id: string;
    fullName: string;
    updatedAt: Date;
    doctorId: string;
    diseaseType: string;
    patientId: string;
    redFlagScore: import("@prisma/client/runtime/library").Decimal | null;
    age: number | null;
    folderColor: string;
    alertCount: number | null;
    lastLogDate: Date | null;
}[]>;
export declare function updatePatientFolder(doctorId: string, patientId: string, updates: {
    redFlagScore?: number;
    alertCount?: number;
    folderColor?: string;
}): Promise<boolean>;
export declare function deletePatientFolder(doctorId: string, patientId: string): Promise<boolean>;
//# sourceMappingURL=doctorService.d.ts.map