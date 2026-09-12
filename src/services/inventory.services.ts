import { AppError } from "../utils/appError";
import { adjustInventory, getInventory, Inventory } from "../models/inventory.models";
import { get } from "../models/warehouse.models";

export const adjustInventoryService = async ( tenantId: number, warehouseId: number, productId: number, changeQuantity: number, reason: | 'purchase' | 'sale' | 'transfer_in' | 'transfer_out' | 'adjustment' | 'return' ): Promise<void> => {
    if (changeQuantity === 0) {  throw new AppError('Quantity cannot be zero', 400); }
    if ( (reason === 'purchase' && changeQuantity < 0) || (reason === 'return' && changeQuantity < 0) || (reason === 'transfer_in' && changeQuantity < 0) ) { throw new AppError(`${reason} quantity must be positive`, 400); }
    if ( (reason === 'sale' && changeQuantity > 0) || (reason === 'transfer_out' && changeQuantity > 0) ) { throw new AppError(`${reason} quantity must be negative`, 400); }
    const exists = await get(tenantId, warehouseId, true);
    if (!exists) { throw new AppError('Warehouse not found', 404); return;}
    await adjustInventory( tenantId, warehouseId, productId, changeQuantity, reason );
};

export const getInventoryService = async ( tenantId: number, warehouseId?: number, productId?: number ): Promise<Inventory[]> => {
    return await getInventory(tenantId, warehouseId, productId);
}