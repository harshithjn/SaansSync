import { Request, Response } from 'express';
export declare function createPrescription(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function listPrescriptions(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
declare const _default: {
    createPrescription: typeof createPrescription;
    listPrescriptions: typeof listPrescriptions;
};
export default _default;
//# sourceMappingURL=prescriptionsController.d.ts.map