import jwt from 'jsonwebtoken';
import { Users } from '../models/auth.models';
import { config } from '../config/env.config';
import crypto from 'crypto';

export const generateAccessToken = (user: Users, sessionId: number): string => {
    return jwt.sign({sessionId: sessionId, userId: user.id, role: user.role, tenantId: user.tenantId, jti: crypto.randomUUID()}, config.secrets.jwtSecret, { expiresIn: "15m" });
}

export const generateRefreshToken = (user: Users): string => {
    return jwt.sign({userId: user.id, jti: crypto.randomUUID()}, config.secrets.refreshSecret, { expiresIn: "7d" });
}

export const generatePasswordResetToken = (user: Users): string => {
    return jwt.sign({userId: user.id, jti: crypto.randomUUID()}, config.secrets.passwordResetSecret, { expiresIn: "15m" });
}