import { Router } from "express";
import { verifyAccessToken } from "../middleware/verifyToken.middleware";
import { createUserController } from '../controllers/user.controllers';

const router = Router();

router.post('/register', verifyAccessToken, createUserController);

export default router;