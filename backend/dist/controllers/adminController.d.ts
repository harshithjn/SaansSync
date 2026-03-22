import { Response } from 'express';
import { AuthedRequest } from '../middleware/jwtMiddleware';
export declare function getAllDoctors(req: AuthedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function approveDoctorAccount(req: AuthedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function rejectDoctorAccount(req: AuthedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function fixApprovedDoctors(_req: AuthedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getRecentPatients(req: AuthedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=adminController.d.ts.map