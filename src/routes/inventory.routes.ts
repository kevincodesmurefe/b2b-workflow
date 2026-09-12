import { Router } from 'express';
import { verifyAccessToken } from '../middleware/verifyToken.middleware';
import { requireRole } from '../middleware/requireRole.middleware';
import * as inventoryControllers from '../controllers/inventory.controllers';

const router = Router();

router.use(verifyAccessToken, requireRole('super_admin', 'business_admin', 'warehouse_manager'));

router.get('/', inventoryControllers.getInventoryController);
router.post('/', inventoryControllers.adjustInventoryController);
