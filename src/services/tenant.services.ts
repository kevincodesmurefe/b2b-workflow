import { Tenant, create, update, deactivate, reactivate, get } from '../models/tenant.models';

export const createTenant = async (name: string): Promise<Tenant> => {
    const result = await create(name);
    return result;
}

export const updateTenant = async (name: string | null, id: number): Promise<Tenant> => {
    const result = await update(name, id);
    return result;
}

export const deactivateTenant = async (id: number): Promise<boolean> => {
    const result = await deactivate(id);
    return result;
}

export const reactivateTenant = async (id: number): Promise<boolean> => {
    const result = await reactivate(id);
    return result;
}

export const getTenants = async (id?: number, isActive?: boolean): Promise<Tenant[]> => {
    const result = await get(id, isActive);
    return result;
}