import { Request, Response } from 'express';
export declare function createAlert(req: Request, res: Response): Promise<void>;
export declare function evaluateAlert(req: Request, res: Response): Promise<void>;
export declare function getAlerts(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function acknowledgeAlert(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
declare const _default: {
    createAlert: typeof createAlert;
    evaluateAlert: typeof evaluateAlert;
    getAlerts: typeof getAlerts;
    acknowledgeAlert: typeof acknowledgeAlert;
};
export default _default;
//# sourceMappingURL=alertsController.d.ts.map