export declare function createDoctorProfile(userId: string, payload: {
    fullName: string;
    email?: string;
    phone?: string;
}): Promise<any>;
export declare function getDoctorPatients(doctorId: string): Promise<any[]>;
export declare function getDoctorLogs(doctorId: string): Promise<any[]>;
export declare function getDoctorAlerts(doctorId: string): Promise<any[]>;
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
}): Promise<any>;
export declare function getPatientFolders(doctorId: string): Promise<{
    patientId: any;
    fullName: any;
    age: number;
    diseaseType: any;
    lastLogDate: any;
    folderColor: any;
    redFlagScore: number;
    alertCount: number;
    doctorId: any;
}[]>;
export declare function updatePatientFolder(doctorId: string, patientId: string, updates: {
    redFlagScore?: number;
    alertCount?: number;
    folderColor?: string;
}): Promise<boolean>;
export declare function deletePatientFolder(doctorId: string, patientId: string): Promise<boolean>;
//# sourceMappingURL=doctorService.d.ts.map