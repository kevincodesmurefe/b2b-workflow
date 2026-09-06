import * as warehouseServices from '../services/warehouse.services';
import { Request, Response, NextFunction } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

interface Id extends ParamsDictionary  { id: string; }
interface CreateBody { name: string; address: string; }
interface WarehouseQuery { id?: string; isActive?: string; }
interface UpdateBody { name: string, address: string | null; }

export const createController = async (req: Request<{}, {}, CreateBody>, res: Response, next: NextFunction): Promise<void> => {
    const { tenantId } = req.user!;
    const { name, address } = req.body;
    if (!name ) { res.status(400).json({message: "Name is required"}); return; }
    try {
        const result = await warehouseServices.createWarehouse(tenantId, name, address);
        res.status(201).json(result);
        return;
    } catch (error) {
        next(error);
    }
}

export const getWarehouseController = async (req: Request<{}, {}, {}, WarehouseQuery>, res: Response, next: NextFunction): Promise<void> => {
    const { tenantId } = req.user!;
    const { id, isActive } = req.query;
    try {
        const isActiveFilter = isActive === undefined ? undefined : isActive === "true";
        const idFilter = id === undefined ? undefined : Number(id);
        const result = await warehouseServices.getWarehouses(tenantId, idFilter, isActiveFilter);
        res.status(200).json(result);
        return;
    } catch (error) {
        next(error);
    }
}

export const updateController = async (req: Request<Id, {}, UpdateBody>, res: Response, next: NextFunction): Promise<void> => {
        const { name, address } = req.body;
        const { tenantId } = req.user!;
        const { id } = req.params;
        if (!name ) { res.status(400).json({message: "Name is required"}); return; }
        try {
            const result = await warehouseServices.updateWarehouse(Number(id), tenantId, name, address);
            res.status(200).json(result);
            return;
        } catch (error) {
            next(error);
        }
}

export const deactivateController = async (req: Request<Id>, res: Response, next: NextFunction): Promise<void> => {
    const { tenantId } = req.user!;
    const { id } = req.params;
    try {
        await warehouseServices.deactivateWarehouse(Number(id), tenantId);
        res.status(200).json({message: 'Warehouse deactivated'});
        return;
    } catch (error) {
        next(error);
    }
}

export const reactivateController = async (req: Request<Id>, res: Response, next: NextFunction): Promise<void> => {
    const { tenantId } = req.user!;
    const { id } = req.params;
    try {
        await warehouseServices.reactivateWarehouse(Number(id), tenantId);
        res.status(200).json({message: 'Warehouse reactivated'});
        return;
    } catch (error) {
        next(error);
    }
}