export declare function createDailyLog(payload: {
    patientId: string;
    diseaseType: string;
    commonData: any;
    diseaseSpecificData: any;
}): Promise<{
    logEntry: any;
    alert: {
        level: "RED" | "YELLOW" | "ORANGE";
        score: number;
        drivers: string[];
    } | null;
    score: number;
    drivers: string[];
}>;
export declare function getPatientLogs(patientId: string): Promise<any[]>;
//# sourceMappingURL=logsService.d.ts.map