import { Router } from 'express';
import { verifyAccessToken } from '../middleware/verifyToken.middleware';
import { requireRole } from '../middleware/requireRole.middleware';
import * as productControllers from '../controllers/product.controllers';

const router = Router();

router.use(verifyAccessToken, requireRole('super_admin', 'business_admin'));

router.post('/', productControllers.createController);
router.get('/', productControllers.getController);
router.patch('/:id', productControllers.updateController);
router.patch('/:id/deactivate', productControllers.deactivateController);
router.patch('/:id/reactivate', productControllers.reactivateController);

export default router;

