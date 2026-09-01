import { Router } from "express";
import { verifyAccessToken, verifyResetToken } from "../middleware/verifyToken.middleware";
import { requireRole } from "../middleware/requireRole.middleware";
import * as resetControllers from '../controllers/passwordReset.controllers';

const router = Router();

router.post('/email', verifyAccessToken, requireRole('super_admin', 'business_admin'), resetControllers.resetEmailController);
router.put('/reset', verifyResetToken, resetControllers.resetController);

export default router;