import { Request, Response, NextFunction } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import * as productServices from '../services/product.services';

interface Id extends ParamsDictionary  { id: string; }
interface CreateBody { sku: string; name: string; description: string; unitPrice: number; }
interface UpdateBody { sku?: string; name?: string; description?: string; unitPrice?: number }
interface GetQuery { id?: string; isActive?: string; }

export const createController = async (req: Request<{}, {}, CreateBody>, res: Response, next: NextFunction): Promise<void> =>{
    const { sku, name, description, unitPrice } = req.body;
    const { tenantId } = req.user!;
    if (!sku || !name || !description || !unitPrice) { res.status(400).json({message: 'All fields are required'}); return; }
    try {
        const result = await productServices.createService(tenantId, sku, name, description, unitPrice);
        res.status(201).json(result);
        return;
    } catch (error) {
        next(error);
    }
}

export const updateController = async (req: Request<Id, {}, UpdateBody>, res: Response, next: NextFunction): Promise<void> => {
    const { sku, name, description, unitPrice } = req.body;
    const { tenantId } = req.user!;
    const { id } = req.params;
    try {
        const result = await productServices.updateService(Number(id), tenantId, sku, name, description, unitPrice);
        res.status(200).json({message: 'Record updated successfully', product: result});
        return;
    } catch (error) {
        next(error);
    }
}

export const getController = async (req: Request<{}, {}, {}, GetQuery>, res: Response, next: NextFunction): Promise<void> => {
    const { id, isActive } = req.query;
    const { tenantId } = req.user!;
    try {
        const isActiveFilter = isActive === undefined ? undefined : isActive === "true";
        const idFilter = id === undefined ? undefined : Number(id);
        const result = await productServices.getService(tenantId, idFilter, isActiveFilter);
        res.status(200).json(result);
        return;
    } catch (error) {
        next(error);
    }
}

export const deactivateController = async (req: Request<Id>, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { tenantId } = req.user!;
    try {
        await productServices.deactivateService(Number(id), tenantId);
        res.status(200).json({message: 'Product deactivated successfuly'});
        return;
    } catch (error) {
        next(error);
    }
}

export const reactivateController = async (req: Request<Id>, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { tenantId } = req.user!;
    try {
        await productServices.reactivate(Number(id), tenantId);
        res.status(200).json({message: 'Product reactivated successfully'});
        return;
    } catch (error) {
        next(error);
    }
}