import { Router } from 'express';
import { verifyAccessToken } from "../middleware/verifyToken.middleware";
import { requireRole } from '../middleware/requireRole.middleware';
import * as userControllers from '../controllers/user.controllers';

const router = Router();

router.post('/register', verifyAccessToken, requireRole('super_admin', 'business_admin'), userControllers.createUserController);
router.get('/:id', verifyAccessToken, requireRole('super_admin', 'business_admin'), userControllers.getUserController);
router.get('/user-list', verifyAccessToken, requireRole('super_admin', 'business_admin'), userControllers.listUsersController);
router.patch('/:id/update-profile', verifyAccessToken, requireRole('super_admin', 'business_admin'), userControllers.updateUserProfileController);
router.patch('/:id/change-role', verifyAccessToken, requireRole('super_admin', 'business_admin'), userControllers.updateUserRoleController);
router.patch('/:id/deactivate', verifyAccessToken, requireRole('super_admin', 'business_admin'), userControllers.deactivateUserController);
router.patch('/:id/reactivate', verifyAccessToken, requireRole('super_admin', 'business_admin'), userControllers.reactivateUserController);
router.patch('/change-password-request', userControllers.mustChangeController);
router.put('/change-password', verifyAccessToken, userControllers.updateUserPasswordController);


export default router;