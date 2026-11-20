import { createHash } from 'node:crypto';
import bcrypt from 'bcrypt';
import { AppError } from '../utils/appError';
import { generatePasswordResetToken } from '../utils/generateTokens';
import * as resetModel from '../models/passwordReset.models';
import * as userModel from '../models/user.models';

const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex');

export const mustChangePassword = async (email: string): Promise<void> => {
    const success = await userModel.mustChange(email);
    if (!success) throw new AppError("User not found", 404);
}

export const nitiateReset = async ( tenantId: number, userId: number ): Promise<{ token: string; email: string }> => {
    const user = await userModel.getById(userId, tenantId);
    if (!user) throw new AppError('User not found', 404);
    const resetToken = generatePasswordResetToken(user);
    const success = await resetModel.create( userId, hashToken(resetToken) );
    if (!success) throw new AppError('Initiation failed', 500);
    return { token: resetToken, email: user.email };
};

export const useService = async (userId: number, tenantId: number, token: string, password: string): Promise<void> => {
    const passwordHash = await bcrypt.hash(password, 10);
    const success = await resetModel.completeReset(userId, tenantId, hashToken(token), passwordHash);
    if (!success) throw new AppError('Invalid or expired reset token', 401);
}