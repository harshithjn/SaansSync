export declare function insertPrescription(payload: any): Promise<{
    id: string;
    createdAt: Date;
    doctorId: string | null;
    date: Date;
    medications: import("@prisma/client/runtime/library").JsonValue;
    instructions: string | null;
    patientId: string;
}>;
export declare function getPrescriptions(query: {
    patientId?: string;
    doctorId?: string;
    startDate?: string;
    endDate?: string;
}): Promise<{
    id: string;
    createdAt: Date;
    doctorId: string | null;
    date: Date;
    medications: import("@prisma/client/runtime/library").JsonValue;
    instructions: string | null;
    patientId: string;
}[]>;
declare const _default: {
    insertPrescription: typeof insertPrescription;
    getPrescriptions: typeof getPrescriptions;
};
export default _default;
//# sourceMappingURL=prescriptionsService.d.ts.map