import { Request, Response } from 'express';
export declare function createPatient(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getPatient(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function updatePatient(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getPatientLogs(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getPatientMedications(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function canLogToday(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=patientController.d.ts.map