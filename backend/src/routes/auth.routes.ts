import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';

export const authRouter = Router();

// Public authentication routes (protected by strict rate limiting)
authRouter.post('/register', authLimiter, AuthController.register);
authRouter.post('/login', authLimiter, AuthController.login);
authRouter.post('/verify-2fa', authLimiter, AuthController.verify2fa);
authRouter.post('/refresh', AuthController.refresh);
authRouter.post('/logout', AuthController.logout);

// 2FA Management (Requires active authentication)
authRouter.post('/2fa/setup', authenticate, AuthController.setup2fa);
authRouter.post('/2fa/enable', authenticate, AuthController.enable2fa);
authRouter.post('/2fa/disable', authenticate, AuthController.disable2fa);
