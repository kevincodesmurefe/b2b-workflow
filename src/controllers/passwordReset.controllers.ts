import * as emailServices from '../services/email.services';
import * as resetServices from '../services/passwordReset.services';
import { updateUserPassword } from '../services/user.services';
import { logoutAll } from '../services/auth.services';
import { resetBody } from '../middleware/verifyToken.middleware';
import { config } from '../config/env.config';
import { Request, Response, NextFunction } from 'express';

interface ResetBody{ 
    userId: number;
    email: string;
 }
export const resetEmailController = async (req: Request<{}, {}, ResetBody>, res: Response, next: NextFunction): Promise<void> => {
    const { tenantId } = req.user;
    const { userId, email } = req.body;
    try {
         const token = await resetServices.nitiateReset(tenantId, userId);
         const link = `${config.clientUrl}/reset-password/${token}`;
         emailServices.passwordResetEmail(link, email);
         res.status(200).json({message: 'If active user exists, reset email will be sent'});
         return;
    } catch (error) {
        next(error); 
    }
}

export const resetController = async (req: Request<{}, {}, resetBody>, res: Response, next: NextFunction): Promise<void> =>{
    const { tenantId, userId, password, resetToken} = req.body;
    try {
        await resetServices.useService(userId, resetToken);
        await updateUserPassword(userId, tenantId, password);
        res.status(200).json({message: "Passowrd updated"});
        await logoutAll(userId);
        return;
    } catch (error) {
        next(error);
    }
}