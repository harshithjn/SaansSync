import { Request, Response, NextFunction } from 'express';
export interface AuthUser {
    id: string;
    email?: string;
    role?: string;
}
export interface AuthedRequest extends Request {
    user?: AuthUser;
}
export declare function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
export declare function optionalAuth(req: AuthedRequest, _res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=jwtMiddleware.d.ts.map