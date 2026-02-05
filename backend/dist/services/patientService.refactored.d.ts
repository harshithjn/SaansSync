/**
 * REFACTORED PATIENT SERVICE
 *
 * Key Changes:
 * - ALWAYS creates Auth User with phone (for OTP login)
 * - NO email/password for patients
 * - auth_user_id is MANDATORY
 * - Fails fast if auth creation fails
 */
export declare function createPatient(payload: {
    fullName: string;
    phone: string;
    diseaseType: string;
    doctorId?: string;
    patientData?: any;
}): Promise<any>;
//# sourceMappingURL=patientService.refactored.d.ts.map