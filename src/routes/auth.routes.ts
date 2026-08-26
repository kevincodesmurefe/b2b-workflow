import { Router } from "express";
import { verifyRefreshToken, verifyAccessToken } from "../middleware/verifyToken.middleware";
import { loginController, refreshController, logoutController, logoutAllController } from "../controllers/auth.controllers";

const router = Router();

router.post('/login', loginController);
router.put('/refresh', verifyRefreshToken, refreshController);
router.put('/logout', verifyAccessToken, logoutController);
router.put('/logout-all', verifyAccessToken, logoutAllController);

export default router;