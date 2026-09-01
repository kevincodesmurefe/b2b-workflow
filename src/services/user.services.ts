import bcrypt from 'bcrypt';
import * as userModel from '../models/user.models';
import * as authModels from '../models/auth.models';
import { Users } from '../models/auth.models';
import { AppError } from '../utils/appError';
import { get } from 'node:http';

export type SafeUser = Omit<Users, 'passwordHash'>;

const sanitizeUser = (user: Users): SafeUser => {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
}

export const createUser = async (tenantId: number, email: string, password: string, role: Users["role"]): Promise<SafeUser> => {
    const existing = await userModel.getByEmail(email, tenantId);
    if (existing) {
        throw new AppError("A user with this email already exists", 409);
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await userModel.create(tenantId, email, passwordHash, role);
    return sanitizeUser(user);
}

export const getUser = async (id: number, tenantId: number): Promise<SafeUser> => {
    const user = await userModel.getById(id, tenantId);
    if (!user) throw new AppError("User not found", 404);
    return sanitizeUser(user);
}

export const listUsers = async (tenantId: number, role?: Users["role"]): Promise<SafeUser[]> => {
    const users = await userModel.listByTenant(tenantId, role);
    return users.map(sanitizeUser);
}

export const updateUserProfile = async (id: number, tenantId: number, email: string): Promise<SafeUser> => {
    const user = await userModel.updateProfile(id, tenantId, email);
    if (!user) throw new AppError("User not found", 404);
    return sanitizeUser(user);
}

export const updateUserPassword = async (id: number, tenantId: number, newPassword: string): Promise<SafeUser> => {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const user = await userModel.updatePassword(id, tenantId, passwordHash);
    if (!user) throw new AppError("User not found", 404);
    return sanitizeUser(user);
}

export const verifyPassword = async (id: number, tenantId: number, oldPassword: string): Promise<boolean> => {
    const getUser = await authModels.getUserById(id, tenantId);
    if (!getUser ) { throw new AppError('User not found', 404); return false; }
    const dummyHash = "$2b$10$invalidhashthatisfakePADDINGXXXXXXXXXXXXXX";
    const isMatch = await bcrypt.compare(oldPassword, getUser?.passwordHash ?? dummyHash);
    return isMatch;
}

export const updateUserRole = async (id: number, tenantId: number, role: Users["role"]): Promise<SafeUser> => {
    const user = await userModel.updateRole(id, tenantId, role);
    if (!user) throw new AppError("User not found", 404);
    return sanitizeUser(user);
}

export const deactivateUser = async (id: number, tenantId: number): Promise<void> => {
    const success = await userModel.deactivate(id, tenantId);
    if (!success) throw new AppError("User not found", 404);
}

export const reactivateUser = async (id: number, tenantId: number): Promise<void> => {
    const success = await userModel.reactivate(id, tenantId);
    if (!success) throw new AppError("User not found", 404);
}

