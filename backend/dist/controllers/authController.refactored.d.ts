/**
 * REFACTORED AUTH CONTROLLER
 *
 * Simplified to 3 core flows:
 * 1. Admin Login (email/password)
 * 2. Doctor Login (email/password) + Registration (OTP)
 * 3. Patient Login (OTP ONLY)
 */
import { Request, Response } from 'express';
import { AuthedRequest } from '../middleware/jwtMiddleware';
export declare function adminLogin(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function doctorLogin(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function startDoctorRegistration(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function completeDoctorRegistration(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function patientLoginOtp(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function verifyPatientOtp(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function authMe(req: AuthedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function signOut(_req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=authController.refactored.d.ts.map