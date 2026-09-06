import * as warehouseModel from '../models/warehouse.models';
import { Warehouse } from '../models/warehouse.models';
import { AppError  } from '../utils/appError';

export const createWarehouse = async (tenantId: number, name: string, address: string | null): Promise<Warehouse> => {
    return warehouseModel.create(tenantId, name, address);
}

export const getWarehouses = async (tenantId: number, id?: number, isActive?: boolean): Promise<Warehouse[]> => {
    return warehouseModel.get(tenantId, id, isActive);
}

export const updateWarehouse = async (id: number, tenantId: number, name: string, address: string | null): Promise<Warehouse> => {
    const result = await warehouseModel.update(id, tenantId, name, address);
    if (!result) throw new AppError("Warehouse not found", 404);
    return result;
}

export const deactivateWarehouse = async (id: number, tenantId: number): Promise<void> => {
    const success = await warehouseModel.deactivate(id, tenantId);
    if (!success) throw new AppError("Warehouse not found", 404);
}

export const reactivateWarehouse = async (id: number, tenantId: number): Promise<void> => {
    const success = await warehouseModel.reactivate(id, tenantId);
    if (!success) throw new AppError("Warehouse not found", 404);
}