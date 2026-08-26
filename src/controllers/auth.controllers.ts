import { Request, Response, NextFunction } from "express";
import { login, refresh, logout, logoutAll } from "../services/auth.services";
import { RefreshBody } from "../middleware/verifyToken.middleware";
import { error } from "node:console";
import { AppError } from "../utils/appError";

interface Login {
    email: string;
    password: string;
}

export const loginController = async (req: Request<{}, {}, Login>, res: Response, next: NextFunction): Promise<void> => {
    const { email, password } = req.body;
    if (!email || !password) { res.status(400).json({message: 'email and password are required'}); return; }
    try {
        const result = await login(email, password);
        res.status(200).json(result);
        return;
    } catch (error) {
        next(error);
    }
}

 export const refreshController = async (req: Request<{}, {}, RefreshBody>, res: Response, next: NextFunction): Promise<void> => {
    const { refreshToken } = req.body;
    const { userId, tenantId } = req.user;
    try {
        const result = await refresh(userId, tenantId, refreshToken);
        res.status(200).json(result);
        return;
    } catch (error) {
      next(error);
    }
 }

 interface Logout { refreshToken: string; }
 export const logoutController = async (req: Request<{}, {}, Logout>, res: Response, next: NextFunction): Promise<void> => {
    const { refreshToken } = req.body;
    const { sessionId } = req.user;
    if (!refreshToken || !sessionId) { res.status(400).json({message: "Session Id and Token are required"}); return; }
    try {
        const result = await logout(Number(sessionId), refreshToken);
        if (!result) { throw new AppError('active session not found', 404); }
        res.status(200).json({message: "session revoked successfully"});
        return;
    } catch (error) {
        next(error);
    }
 }

 export const logoutAllController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { userId } = req.user;
        if (!userId) { res.status(400).json({message: "User Id is required"}); }
        try {
            const result = await logoutAll(userId);
            if (!result) { throw new AppError('active sessions not found', 404); }
            res.status(200).json({message: "All session revoked successfully"});
            return;
        } catch (error) {
            next(error);
        } 
 }