import { Request, Response, NextFunction } from 'express';
import { adjustInventoryService, getInventoryService, transferStockService } from '../services/inventory.services';

interface AdjustInventoryRequestBody {
    warehouseId: number;
    productId: number;
    changeQuantity: number;
    reason: 'purchase' | 'sale' | 'transfer_in' | 'transfer_out' | 'adjustment' | 'return';
}

interface TransferBody { productId: number; fromWarehouseId: number; toWarehouseId: number; quantity: number; }

interface GetQuery { warehouseId: string; productId: string; }

export const adjustInventoryController = async ( req: Request<{}, {}, AdjustInventoryRequestBody>, res: Response, next: NextFunction ): Promise<void> => {
        const { warehouseId, productId, changeQuantity, reason } = req.body;
        const { tenantId } = req.user!
        if (!warehouseId || !productId || !changeQuantity || !reason) {  res.status(400).json({message: 'All fields are required'}); return; }
    try {
        await adjustInventoryService( tenantId, warehouseId, productId, changeQuantity, reason );
        res.status(200).json({ message: 'Inventory adjusted successfully' });
    } catch (error) {
        next(error);
    }
}

export const getInventoryController = async (req: Request<{}, {}, {}, GetQuery>, res: Response, next: NextFunction): Promise<void> => {
    const { tenantId } = req.user!
    const { warehouseId, productId } = req.query;
    try {
        const result = await getInventoryService(tenantId, Number(warehouseId), Number(productId));
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export const transferStockController = async (req: Request<{}, {}, TransferBody>, res: Response, next: NextFunction): Promise<void> => {
    const { tenantId, userId } = req.user;
    const { productId, fromWarehouseId, toWarehouseId, quantity } = req.body;
    if (!productId || !fromWarehouseId || !toWarehouseId || !quantity) { res.status(400).json({message: 'All fields are required'}); return; }
    try {
        const result = await transferStockService(userId, tenantId, productId, fromWarehouseId, toWarehouseId, quantity);
        res.status(200).json({message: 'Stock transfer initiated successfully', result});
    } catch (error) {
        next(error); 
    }
}