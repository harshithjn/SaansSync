import { Request, Response, NextFunction } from 'express';
export declare function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
export default authMiddleware;
//# sourceMappingURL=authMiddleware.d.ts.map