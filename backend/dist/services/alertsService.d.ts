export interface AlertInsert {
    patient_id: string;
    doctor_id: string;
    level: string;
    reason_text: string;
    disease_type: string;
    alert_data?: Record<string, any>;
}
export declare function insertAlert(payload: AlertInsert, useAdmin?: boolean): Promise<any>;
export declare function getAlertsByDoctor(doctorId: string): Promise<any[]>;
export declare function getAlertsByPatient(patientId: string): Promise<any[]>;
declare const _default: {
    insertAlert: typeof insertAlert;
    getAlertsByDoctor: typeof getAlertsByDoctor;
    getAlertsByPatient: typeof getAlertsByPatient;
};
export default _default;
//# sourceMappingURL=alertsService.d.ts.map