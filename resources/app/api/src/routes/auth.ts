import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { authRateLimiter, loginRateLimiter, registerRateLimiter, passwordResetRateLimiter, resendVerificationRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/register', registerRateLimiter, (req, res) => authController.register(req, res));
router.post('/login', loginRateLimiter, (req, res) => authController.login(req, res));
router.get('/me', requireAuth, (req, res) => authController.me(req, res));
router.post('/verify-email', authRateLimiter, (req, res) => authController.verifyEmail(req, res));
router.post('/resend-verification', resendVerificationRateLimiter, (req, res) => authController.resendVerification(req, res));
router.post('/forgot-password', passwordResetRateLimiter, (req, res) => authController.forgotPassword(req, res));
router.post('/validate-reset-token', passwordResetRateLimiter, (req, res) => authController.validateResetToken(req, res));
router.post('/reset-password', passwordResetRateLimiter, (req, res) => authController.resetPassword(req, res));
router.post('/change-password', requireAuth, (req, res) => authController.changePassword(req, res));
router.post('/logout', requireAuth, (req, res) => authController.logout(req, res));

export default router;
