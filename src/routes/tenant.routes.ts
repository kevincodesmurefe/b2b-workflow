import { Router } from "express";
import { registerTenant, updateTenantName } from "../controllers/tenant.controllers";

const router = Router();

router.post('/register', registerTenant);
router.patch('/:id/update', updateTenantName);

export default router;