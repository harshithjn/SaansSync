export declare function isAdminEmail(email?: string | null): boolean;
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
export declare function doctorLoginWithPassword(email: string, password: string): Promise<{
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
    };
    error?: undefined;
}>;
export declare function doctorLoginWithOtp(email: string): Promise<{
    success: boolean;
    error: string;
} | {
    success: boolean;
    error?: undefined;
}>;
export declare function verifyDoctorOtp(email: string, token: string): Promise<{
    success: boolean;
    error: string;
    doctorProfile?: undefined;
    access_token?: undefined;
    refresh_token?: undefined;
    user?: undefined;
} | {
    success: boolean;
    error: string;
    doctorProfile: any;
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
    };
    error?: undefined;
}>;
export declare function setupDoctorPassword(phone: string, token: string, newPassword: string): Promise<{
    success: boolean;
    error: string;
} | {
    success: boolean;
    error?: undefined;
}>;
export declare function startPasswordReset(phone: string): Promise<{
    success: boolean;
    error: string;
} | {
    success: boolean;
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
    };
    error?: undefined;
}>;
export declare function patientLoginWithPassword(email: string, password: string): Promise<{
    success: boolean;
    error: string;
    session?: undefined;
} | {
    success: boolean;
    session: {
        userId: any;
        email: any;
        role: string;
    };
    error?: undefined;
}>;
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
        id: string | undefined;
        email: string | undefined;
    };
    error?: undefined;
}>;
export declare function doctorSignup(email: string, fullName: string, phone?: string): Promise<{
    success: boolean;
    error: string;
    message?: undefined;
} | {
    success: boolean;
    message: string;
    error?: undefined;
}>;
export declare function testEmail(email: string): Promise<{
    success: boolean;
    error: string;
} | {
    success: boolean;
    error?: undefined;
}>;
export declare function exchangeCodeForSession(code: string): Promise<{
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
    role: "admin";
    profile: {
        email: string | null | undefined;
    };
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
//# sourceMappingURL=authService.d.ts.map