import { Request, Response } from 'express';
export declare function createPersonalizedAlert(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function listPersonalizedAlerts(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
declare const _default: {
    createPersonalizedAlert: typeof createPersonalizedAlert;
    listPersonalizedAlerts: typeof listPersonalizedAlerts;
};
export default _default;
//# sourceMappingURL=personalizedAlertsController.d.ts.map