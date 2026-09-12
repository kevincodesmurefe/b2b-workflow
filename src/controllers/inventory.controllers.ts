import { Request, Response, NextFunction } from 'express';
import { adjustInventoryService, getInventoryService } from '../services/inventory.services';

interface AdjustInventoryRequestBody {
    warehouseId: number;
    productId: number;
    changeQuantity: number;
    reason: | 'purchase' | 'sale' | 'transfer_in' | 'transfer_out' | 'adjustment' | 'return';
}

interface GetQuery { warehouseId: string; productId: string; }

export const adjustInventoryController = async ( req: Request<{}, {}, AdjustInventoryRequestBody>, res: Response, next: NextFunction ): Promise<void> => {
    try {
        const { warehouseId, productId, changeQuantity, reason } = req.body;
        const { tenantId } = req.user!
        await adjustInventoryService( tenantId, warehouseId, productId, changeQuantity, reason );
        res.status(200).json({ message: 'Inventory adjusted successfully' });
    } catch (error) {
        next(error);
    }
};

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