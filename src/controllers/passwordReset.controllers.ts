import * as emailServices from '../services/email.services';
import * as resetServices from '../services/passwordReset.services';
import { resetBody } from '../middleware/verifyToken.middleware';
import { config } from '../config/env.config';
import { Request, Response, NextFunction } from 'express';

interface ResetBody {
    userId: number;
}

export const resetEmailController = async (req: Request<{}, {}, ResetBody>, res: Response, next: NextFunction): Promise<void> => {
    const { tenantId } = req.user;
    const { userId } = req.body;
    try {
        const { token, email } = await resetServices.nitiateReset( tenantId, userId );
        const link = `${config.clientUrl}/reset-password/${token}`;
        await emailServices.passwordResetEmail(link, email);
        res.status(200).json({ message: 'If active user exists, reset email will be sent' });
    } catch (error) {
        next(error);
    }
}

export const resetController = async (req: Request<{}, {}, resetBody>, res: Response, next: NextFunction): Promise<void> => {
    const { tenantId, userId, password, resetToken } = req.body;
    try {
        await resetServices.useService(userId, tenantId, resetToken, password);
        res.status(200).json({ message: "Password updated. Please sign in again." });
    } catch (error) {
        next(error);
    }
}