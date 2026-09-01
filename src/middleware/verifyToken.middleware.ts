import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env.config';
import { checkById } from '../models/session.models';
import { AppError } from '../utils/appError';
import { log } from 'node:console';

interface AccessTokenPayload {
    userId: number;
    sessionId: number;
    role: 'super_admin' | 'business_admin' | 'warehouse_manager' | 'sales_rep' | 'delivery_agent';
    tenantId: number;
    tokenVersion: number;
}

export const verifyAccessToken = async ( req: Request, res: Response, next: NextFunction ): Promise<void> => {
    const headers = req.headers.authorization;
    if (!headers || !headers.startsWith('Bearer ')) { res.status(401).json({message: "Token is required"}); return; }
    const token = headers.split(" ")[1];
    try {
        const decoded = jwt.verify(token, config.secrets.jwtSecret) as AccessTokenPayload;
        const session = await checkById(decoded.sessionId);
        if (!session || !session.isActive || session.tokenVersion !== decoded.tokenVersion) { next(new AppError('Session revoked', 401)); return; }
        req.user = { sessionId: decoded.sessionId, userId: decoded.userId, role: decoded.role, tenantId: decoded.tenantId };
        next();
        return;
    } catch (error) {
        next(error);
    }
}

interface RefreshTokenPayload {
    userId: number;
    tenantId: number;
}
export interface RefreshBody { refreshToken: string; };
export const verifyRefreshToken = ( req: Request<{}, {}, RefreshBody>, res: Response, next: NextFunction ): void => {
    const { refreshToken } = req.body;
    if (!refreshToken) { res.status(401).json({message: "Token is required"}); return; }
    try {
        const decoded = jwt.verify(refreshToken, config.secrets.refreshSecret) as RefreshTokenPayload;
        req.user = {userId: decoded.userId,tenantId: decoded.tenantId};
        next();
        return;
    } catch (error) {
        next(error);
    }
}

export interface resetBody {
    resetToken: string;
    password: string;
    tenantId: number;
    userId: number;
}

export const verifyResetToken = async (req: Request<{}, {}, resetBody>, res: Response, next: NextFunction): Promise<void> => {
    const { resetToken, password } = req.body;
    if (!resetToken || !password) { res.status(400).json({message: "Password and token are required"}); }
    try {
        const decoded = jwt.verify(resetToken, config.secrets.passwordResetSecret) as RefreshTokenPayload;
        req.body = { tenantId: decoded.tenantId, userId: decoded.userId, resetToken, password  };
        next();
        return;
    } catch (error) {
        next(error);
    }
}