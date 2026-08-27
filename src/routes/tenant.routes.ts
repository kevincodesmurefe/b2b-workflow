import { Router } from "express";
import { verifyAccessToken } from "../middleware/verifyToken.middleware";
import { requireRole } from "../middleware/requireRole.middleware";
import { registerTenant, updateTenantName, deactivateTenantController, reactivateTenantController, getTenantsController } from "../controllers/tenant.controllers";

const router = Router();

router.get('/', verifyAccessToken, requireRole('super_admin'), getTenantsController);
router.post('/', verifyAccessToken, requireRole('super_admin'), registerTenant);
router.patch('/:id/update', verifyAccessToken, requireRole('super_admin'), updateTenantName);
router.put('/:id/deactivate', verifyAccessToken, requireRole('super_admin'), deactivateTenantController);
router.put('/:id/reactivate', verifyAccessToken, requireRole('super_admin'), reactivateTenantController);


export default router;