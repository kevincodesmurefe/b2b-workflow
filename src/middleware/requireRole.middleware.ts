import { Request, Response, NextFunction, RequestHandler } from 'express';
export const requireRole = (...roles: string[]): RequestHandler => {
    return (req: Request, res:Response, next: NextFunction): void => {
        if (!req.user?.role) { res.status(403).json({message: 'No role assigned to this account'}); return; }
        if (!roles.includes(req.user.role)) { res.status(403).json({message: 'Forbidden'}); return; }
        next();
        return;
    }
}
 
 