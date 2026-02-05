export declare function insertPrescription(payload: any): Promise<any>;
export declare function getPrescriptions(query: {
    patientId?: string;
    doctorId?: string;
    startDate?: string;
    endDate?: string;
}): Promise<any>;
declare const _default: {
    insertPrescription: typeof insertPrescription;
    getPrescriptions: typeof getPrescriptions;
};
export default _default;
//# sourceMappingURL=prescriptionsService.d.ts.map