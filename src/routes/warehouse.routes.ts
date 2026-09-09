import { Router } from 'express';
import { verifyAccessToken } from "../middleware/verifyToken.middleware";
import { requireRole } from '../middleware/requireRole.middleware';
import * as warehouseController from '../controllers/warehouse.controllers';

export const router = Router();

router.use(verifyAccessToken, requireRole('super_admin', 'business_admin'));

router.get('/', warehouseController.getWarehouseController);
router.post('/', warehouseController.createController);
router.patch('/:id', warehouseController.updateController);
router.patch('/:id/deactivate', warehouseController.deactivateController);
router.patch('/:id/reactivate', warehouseController.reactivateController);

export default router;