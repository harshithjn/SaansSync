export interface AlertInsert {
    patient_id: string;
    doctor_id: string;
    level: string;
    reason_text: string;
    disease_type: string;
    alert_data?: Record<string, any>;
}
export declare function insertAlert(payload: AlertInsert, useAdmin?: boolean): Promise<{
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
}>;
export declare function getAlertsByDoctor(doctorId: string): Promise<{
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
export declare function getAlertsByPatient(patientId: string): Promise<{
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
declare const _default: {
    insertAlert: typeof insertAlert;
    getAlertsByDoctor: typeof getAlertsByDoctor;
    getAlertsByPatient: typeof getAlertsByPatient;
};
export default _default;
//# sourceMappingURL=alertsService.d.ts.map