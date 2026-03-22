export declare function isAdminEmail(email?: string | null): boolean;
export declare function createToken(userId: string, email: string, role: string): string;
export declare function startDoctorRegistration(..._args: any[]): Promise<{
    success: boolean;
    error: string;
}>;
export declare function completeDoctorRegistration(..._args: any[]): Promise<{
    success: boolean;
    error: string;
}>;
export declare function doctorLoginWithPassword(email: string, password?: string): Promise<{
    success: boolean;
    error: string;
    token?: undefined;
    doctorProfile?: undefined;
} | {
    success: boolean;
    token: string;
    doctorProfile: {
        id: string;
        authUserId: string | null;
        email: string;
        fullName: string;
        approvalStatus: string;
        password: string | null;
        createdAt: Date;
        updatedAt: Date;
    };
    error?: undefined;
}>;
export declare function doctorLoginWithOtp(..._args: any[]): Promise<{
    success: boolean;
    error: string;
}>;
export declare function verifyDoctorOtp(..._args: any[]): Promise<{
    success: boolean;
    error: string;
}>;
export declare function setupDoctorPassword(..._args: any[]): Promise<{
    success: boolean;
    error: string;
}>;
export declare function startPasswordReset(..._args: any[]): Promise<{
    success: boolean;
    error: string;
}>;
export declare function patientLoginWithOtp(..._args: any[]): Promise<{
    success: boolean;
    error: string;
}>;
export declare function verifyPatientOtp(..._args: any[]): Promise<{
    success: boolean;
    error: string;
}>;
export declare function patientLoginWithPassword(email: string, password?: string): Promise<{
    success: boolean;
    error: string;
    token?: undefined;
    patientProfile?: undefined;
} | {
    success: boolean;
    token: string;
    patientProfile: {
        id: string;
        authUserId: string | null;
        email: string;
        fullName: string;
        password: string | null;
        createdAt: Date;
        updatedAt: Date;
        doctorId: string | null;
        diseaseType: string;
        patientData: import("@prisma/client/runtime/library").JsonValue | null;
        defaultPassword: string | null;
    };
    error?: undefined;
}>;
export declare function adminLogin(email: string, password?: string): Promise<{
    success: boolean;
    error: string;
    token?: undefined;
} | {
    success: boolean;
    token: string;
    error?: undefined;
}>;
export declare function doctorSignup(email: string, fullName: string, password?: string): Promise<{
    success: boolean;
    error: string;
    token?: undefined;
    doctorProfile?: undefined;
} | {
    success: boolean;
    token: string;
    doctorProfile: {
        id: string;
        authUserId: string | null;
        email: string;
        fullName: string;
        approvalStatus: string;
        password: string | null;
        createdAt: Date;
        updatedAt: Date;
    };
    error?: undefined;
}>;
export declare function patientSignup(email: string, fullName: string, password?: string): Promise<{
    success: boolean;
    error: string;
    token?: undefined;
    patientProfile?: undefined;
} | {
    success: boolean;
    token: string;
    patientProfile: {
        id: string;
        authUserId: string | null;
        email: string;
        fullName: string;
        password: string | null;
        createdAt: Date;
        updatedAt: Date;
        doctorId: string | null;
        diseaseType: string;
        patientData: import("@prisma/client/runtime/library").JsonValue | null;
        defaultPassword: string | null;
    };
    error?: undefined;
}>;
export declare function testEmail(..._args: any[]): Promise<{
    success: boolean;
    error: string;
}>;
export declare function exchangeCodeForSession(..._args: any[]): Promise<{
    success: boolean;
    error: string;
}>;
export declare function getAuthProfile(user: {
    id: string;
    email?: string | null;
    role?: string;
}): Promise<{
    user: {
        id: string;
        email?: string | null;
        role?: string;
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
        role?: string;
    };
    role: "doctor";
    profile: {
        id: string;
        authUserId: string | null;
        email: string;
        fullName: string;
        approvalStatus: string;
        password: string | null;
        createdAt: Date;
        updatedAt: Date;
    };
    approved: boolean;
} | {
    user: {
        id: string;
        email?: string | null;
        role?: string;
    };
    role: "patient";
    profile: {
        id: string;
        authUserId: string | null;
        email: string;
        fullName: string;
        password: string | null;
        createdAt: Date;
        updatedAt: Date;
        doctorId: string | null;
        diseaseType: string;
        patientData: import("@prisma/client/runtime/library").JsonValue | null;
        defaultPassword: string | null;
    };
    approved: boolean;
} | {
    user: {
        id: string;
        email?: string | null;
        role?: string;
    };
    role: null;
    profile: null;
    approved?: undefined;
}>;
//# sourceMappingURL=authService.d.ts.map