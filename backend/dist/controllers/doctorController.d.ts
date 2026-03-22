import { Request, Response } from 'express';
import { AuthedRequest } from '../middleware/jwtMiddleware';
export declare function getDoctorPatients(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getDoctorProfile(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getDoctorLogs(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getDoctorAlerts(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function assignPatient(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function upsertPatientFolder(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getPatientFolders(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function updatePatientFolder(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function deletePatientFolder(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function createDoctorProfile(req: AuthedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=doctorController.d.ts.map