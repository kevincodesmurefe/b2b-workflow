import { Request, Response, NextFunction } from "express";
import { createTenant, updateTenant, deactivateTenant, reactivateTenant, getTenants } from '../services/tenant.services';

interface Name { name: string; }
interface Id { id: string }
export const registerTenant = async (req: Request< {}, {}, Name>, res: Response, next: NextFunction): Promise<void> => {
const { name } = req.body;
try {
    const result = await createTenant(name);
    res.status(201).json(result);
} catch (error) {
    next(error);
}
}

export const updateTenantName = async (req: Request< Id, {}, Name>, res: Response, next: NextFunction): Promise<void> => {
const { name } = req.body;
const { id } = req.params;
try {
    const result = await updateTenant(name, Number(id));
    if(!result) res.status(404).json({message: 'tanant not found'});
    res.status(200).json(result);
} catch (error) {
    next(error);
}
}

export const deactivateTenantController = async (req: Request<Id>, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    try {
        const success = await deactivateTenant(Number(id));
        res.status(200).json({ message: "Tenant deactivated" });
    } catch (error) {
        next(error);
    }
}

export const reactivateTenantController = async (req: Request<Id>, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    try {
        const success = await reactivateTenant(Number(id));
        res.status(200).json({ message: "Tenant reactivated" });
    } catch (error) {
        next(error);
    }
}