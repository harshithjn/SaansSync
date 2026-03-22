export declare function createDailyLog(payload: {
    patientId: string;
    diseaseType: string;
    commonData: any;
    diseaseSpecificData: any;
}): Promise<{
    logEntry: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        diseaseType: string;
        patientId: string;
        logDate: Date;
        diseaseData: import("@prisma/client/runtime/library").JsonValue;
        redFlagScore: import("@prisma/client/runtime/library").Decimal | null;
    };
    alert: {
        level: "RED" | "ORANGE" | "YELLOW";
        score: number;
        drivers: string[];
    } | null;
    score: number;
    drivers: string[];
}>;
export declare function getPatientLogs(patientId: string): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    diseaseType: string;
    patientId: string;
    logDate: Date;
    diseaseData: import("@prisma/client/runtime/library").JsonValue;
    redFlagScore: import("@prisma/client/runtime/library").Decimal | null;
}[]>;
//# sourceMappingURL=logsService.d.ts.map