import { AppError } from '../utils/appError';
import { generatePasswordResetToken } from '../utils/generateTokens';
import * as resetModel from '../models/passwordReset.models';
import * as userModel from '../models/user.models';

export const mustChangePassword = async (email: string): Promise<void> => {
    const success = await userModel.mustChange(email);
    if (!success) { throw new AppError("User not found", 404) };
    return;
} 


export const nitiateReset = async (tenantId: number, userId: number): Promise<string | undefined> => {
    const user = await userModel.getById(userId, tenantId);
    if (!user) { throw new AppError('User not found', 404); return; }
    const resetToken = generatePasswordResetToken(user);
    const success = await resetModel.create(userId, resetToken);
    if (!success) { throw new AppError('Initiation failed', 500); return; }
    return resetToken;
}

export const useService = async (userId: number, token: string): Promise<void> => {
    const success = await resetModel.used(userId, token);
    if (!success) { throw new AppError('token Already used', 401); }
    return;
}