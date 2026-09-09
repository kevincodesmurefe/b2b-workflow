import { AppError } from '../utils/appError';
import * as productModels from '../models/product.models';

export const createService = async (tenantId:number, sku: string, name: string, description: string, unitPrice: number): Promise<productModels.Product> => {
    const exists = await productModels.exists(tenantId, sku);
    if (exists) { throw new AppError(`Product with ${sku} already exists`, 409); }
    if (unitPrice <= 0) { throw new AppError(`Unit price must be a positive number`, 400); }
    const result = await productModels.create(tenantId, sku, name, description, unitPrice);
    return result;
}

export const updateService = async (id: number, tenantId: number, sku?: string, name?: string, description?: string, unitPrice?: number): Promise<productModels.Product > => {
     if (sku) {
        const exists = await productModels.exists(tenantId, sku, id);
        if (exists) { throw new AppError(`Product with ${sku} already exists`, 409); }
     }
     if (unitPrice && unitPrice <= 0) { throw new AppError(`Unit price must be a positive number`, 400); }
     const result = await productModels.update(id, tenantId, sku, name, description, unitPrice);
     if (!result) { throw new AppError(`Product not found`, 404); }
     return result;
}

export const getService = async (tenantId: number, id?: number, isActive?: boolean): Promise<productModels.Product[]> => {
    const result = await productModels.get(tenantId, id, isActive);
    return result;
}

export const deactivateService = async (id: number, tenantId: number): Promise<void> => {
    const result = await productModels.deactivate(id, tenantId);
    if (!result) { throw new AppError(`Product not found`, 404); }
    return;
}

export const reactivate = async (id: number, tenantId: number): Promise<void> => {
    const result = await productModels.reactivate(id, tenantId);
    if (!result) { throw new AppError(`Product not found`, 404); }
    return;
} 