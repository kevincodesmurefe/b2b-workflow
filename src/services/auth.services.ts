import { getuser, getUserById } from "../models/auth.models";
import bcrypt from 'bcrypt';
import { AppError } from "../utils/appError"; 
import { create, update, revokeSessionById, revokeAllSessions } from '../models/session.models';
import { get } from '../models/tenant.models';
import { generateAccessToken, generateRefreshToken } from '../utils/generateTokens';

interface Login {
    accessToken: string;
    refreshToken: string;
    user: { 
        id: number;
        email: string;
        role: 'super_admin' | 'business_admin' | 'warehouse_manager' | 'sales_rep' | 'delivery_agent';
        createdAt: string; 
    }
}

export const login = async (email: string, password: string): Promise<Login> => {
    const exists = await getuser(email);
    const dummyHash = "$2b$10$invalidhashthatisfakePADDINGXXXXXXXXXXXXXX";
    const isMatch = await bcrypt.compare(password, exists?.passwordHash ?? dummyHash);
    if (!exists || !isMatch) { throw new AppError('Invalid credentials', 400);}
    const refreshToken = generateRefreshToken(exists);
    const createSession = await create(exists.id, refreshToken);
    const accessToken = generateAccessToken(exists, createSession.id, createSession.tokenVersion);
    return {
        accessToken,
        refreshToken,
        user: {
            id: exists.id,
            email: exists.email,
            role: exists.role,
            createdAt: exists.createdAt
        }
    };
}

export interface Refresh {
    accessToken: string;
    refreshToken: string
}

export const refresh = async (userId: number, tenantId: number, oldToken: string): Promise<Refresh> => {
    const exists = await getUserById(userId, tenantId);
    const checkTenant = await get(tenantId, true);
    if (!exists || !checkTenant) { throw new AppError('User not found', 404); }
    const refreshToken = generateRefreshToken(exists);
    const updateSession = await update(userId, oldToken, refreshToken);
    if (!updateSession) { throw new AppError('Invalid or expired session', 401);  }
    const accessToken = generateAccessToken(exists, updateSession.id, updateSession.tokenVersion);
    return { accessToken, refreshToken };
}

export const logout = async (id: number, token: string): Promise<boolean> => {
    if (!id || !token) { throw new AppError('session Id and access Token are required', 400); }
    const result = await revokeSessionById(id, token);
    return result;
}

export const logoutAll = async (id: number): Promise<boolean> => {
    const result = await revokeAllSessions(id);
    return result;
}