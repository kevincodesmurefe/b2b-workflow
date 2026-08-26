import { Router } from "express";
import { verifyAccessToken } from "../middleware/verifyToken.middleware";
import { registerTenant, updateTenantName, deactivateTenantController, reactivateTenantController, getTenantsController } from "../controllers/tenant.controllers";

const router = Router();

router.get('/', verifyAccessToken, getTenantsController);
router.post('/', verifyAccessToken, registerTenant);
router.patch('/:id/update', verifyAccessToken, updateTenantName);
router.put('/:id/deactivate', verifyAccessToken, deactivateTenantController);
router.put('/:id/reactivate', verifyAccessToken, reactivateTenantController);


export default router;