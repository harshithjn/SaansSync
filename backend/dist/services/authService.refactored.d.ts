/**
 * UNIFIED AUTHENTICATION SERVICE
 *
 * Single Source of Truth: Supabase Auth (auth.users)
 * Roles: admin | doctor | patient (stored in user_metadata.role)
 *
 * Login Methods:
 * - Admin: Email/Password
 * - Doctor: Email/Password
 * - Patient: Mobile OTP ONLY
 */
export declare function adminLogin(email: string, password: string): Promise<{
    success: boolean;
    error: string;
    access_token?: undefined;
    refresh_token?: undefined;
    user?: undefined;
} | {
    success: boolean;
    access_token: string;
    refresh_token: string;
    user: {
        id: string;
        email: string | undefined;
        role: string;
    };
    error?: undefined;
}>;
export declare function doctorLogin(email: string, password: string): Promise<{
    success: boolean;
    error: string;
    doctorProfile?: undefined;
    access_token?: undefined;
    refresh_token?: undefined;
    user?: undefined;
} | {
    success: boolean;
    doctorProfile: any;
    access_token: string;
    refresh_token: string;
    user: {
        id: string;
        email: string | undefined;
        role: string;
    };
    error?: undefined;
}>;
export declare function startDoctorRegistration(phone: string): Promise<{
    success: boolean;
    error: string;
} | {
    success: boolean;
    error?: undefined;
}>;
export declare function completeDoctorRegistration(params: {
    phone: string;
    token: string;
    email: string;
    fullName: string;
    password: string;
    altPhone?: string;
}): Promise<{
    success: boolean;
    error: string;
    doctorProfile?: undefined;
} | {
    success: boolean;
    doctorProfile: any;
    error?: undefined;
}>;
export declare function patientLoginWithOtp(phone: string): Promise<{
    success: boolean;
    error: string;
} | {
    success: boolean;
    error?: undefined;
}>;
export declare function verifyPatientOtp(phone: string, token: string): Promise<{
    success: boolean;
    error: string;
    patientProfile?: undefined;
    access_token?: undefined;
    refresh_token?: undefined;
    user?: undefined;
} | {
    success: boolean;
    patientProfile: any;
    access_token: string;
    refresh_token: string;
    user: {
        id: string;
        email: string | undefined;
        role: string;
    };
    error?: undefined;
}>;
export declare function getAuthProfile(user: {
    id: string;
    email?: string | null;
}): Promise<{
    user: {
        id: string;
        email?: string | null;
    };
    role: "doctor";
    profile: any;
    approved: boolean;
} | {
    user: {
        id: string;
        email?: string | null;
    };
    role: "patient";
    profile: any;
    approved: boolean;
} | {
    user: {
        id: string;
        email?: string | null;
    };
    role: null;
    profile: null;
    approved?: undefined;
}>;
//# sourceMappingURL=authService.refactored.d.ts.map