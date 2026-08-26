import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';

export const errorHandler = (err: unknown, req: Request, res: Response, next: NextFunction): void => {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
    }

    if (err instanceof Error && err.name === 'JsonWebTokenError') {
        res.status(401).json({ message: "Invalid token" });
        return;
    }

    if (err instanceof Error && err.name === 'TokenExpiredError') {
        res.status(401).json({ message: "Token expired", code: "TOKEN_EXPIRED" });
        return;
    }

    if (typeof err === 'object' && err !== null && 'code' in err) {
        const pgErr = err as { code: string };
        if (pgErr.code === '23505') {
            res.status(409).json({ message: "Already exists" });
            return;
        }
        if (pgErr.code === '23503') {
            res.status(404).json({ message: "Related record not found" });
            return;
        }
    }

    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
}