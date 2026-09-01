import { Request, Response, NextFunction } from "express";
import { ParamsDictionary } from 'express-serve-static-core';
import * as userService from "../services/user.services";
import { logoutAll } from '../services/auth.services';
import { mustChangePassword } from "../services/passwordReset.services";
import { Users } from "../models/auth.models";

interface Id extends ParamsDictionary  { id: string; }
interface CreateUserBody { email: string; password: string; role: Users["role"]; }
interface UpdateProfileBody { email: string; }
interface UpdatePasswordBody { oldPassword: string; newPassword: string }
interface UpdateRoleBody { role: Users["role"]; }
interface ListUsersQuery { role?: Users["role"]; }
interface MustchangeBody { email: string; }

export const createUserController = async (req: Request<{}, {}, CreateUserBody>, res: Response, next: NextFunction): Promise<void> => {
    const { email, password, role } = req.body;
    const tenantId = req.user!.tenantId;
    try {
        const user = await userService.createUser(tenantId, email, password, role);
        res.status(201).json(user);
    } catch (error) {
        next(error);
    }
}

export const getUserController = async (req: Request<Id>, res: Response, next: NextFunction): Promise<void> => {
    const tenantId = req.user!.tenantId;
    try {
        const user = await userService.getUser(Number(req.params.id), tenantId);
        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
}

export const listUsersController = async (req: Request<{}, {}, {}, ListUsersQuery>, res: Response, next: NextFunction): Promise<void> => {
    const tenantId = req.user!.tenantId;
    try {
        const users = await userService.listUsers(tenantId, req.query.role);
        res.status(200).json(users);
    } catch (error) {
        next(error);
    }
}

export const updateUserProfileController = async (req: Request<Id, {}, UpdateProfileBody>, res: Response, next: NextFunction): Promise<void> => {
    const tenantId = req.user!.tenantId;
    try {
        const user = await userService.updateUserProfile(Number(req.params.id), tenantId, req.body.email);
        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
}

export const updateUserPasswordController = async (req: Request<{}, {}, UpdatePasswordBody>, res: Response, next: NextFunction): Promise<void> => {
    const { userId, tenantId } = req.user;
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) { res.status(400).json({message: 'All fields are required'}); return; }
    try {
        const verifyPassword = await userService.verifyPassword(userId, tenantId, oldPassword);
        if (!verifyPassword) { res.status(400).json({message: "Incorrect Password"}); }
        const user = await userService.updateUserPassword(userId, tenantId, newPassword);
        res.status(200).json(user);
        await logoutAll(userId);
        return;
    } catch (error) {
        next(error);
    }
}

export const updateUserRoleController = async (req: Request<Id, {}, UpdateRoleBody>, res: Response, next: NextFunction): Promise<void> => {
    const tenantId = req.user!.tenantId;
    try {
        const user = await userService.updateUserRole(Number(req.params.id), tenantId, req.body.role);
        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
}

export const deactivateUserController = async (req: Request<Id>, res: Response, next: NextFunction): Promise<void> => {
    const tenantId = req.user!.tenantId;
    try {
        await userService.deactivateUser(Number(req.params.id), tenantId);
        res.status(200).json({ message: "User deactivated" });
    } catch (error) {
        next(error);
    }
}

export const reactivateUserController = async (req: Request<Id>, res: Response, next: NextFunction): Promise<void> => {
    const tenantId = req.user!.tenantId;
    try {
        await userService.reactivateUser(Number(req.params.id), tenantId);
        res.status(200).json({ message: "User reactivated" });
    } catch (error) {
        next(error);
    }
}

export const mustChangeController = async (req: Request<{}, {}, MustchangeBody>, res: Response, next: NextFunction): Promise<void> => {
    const { email } = req.body;
    try {
        await mustChangePassword(email);
        res.status(200).json({ message: "Request sent"});
    } catch (error) {
        next(error);
    }
}