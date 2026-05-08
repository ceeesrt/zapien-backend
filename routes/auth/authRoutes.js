import express from 'express';
import AuthController from '../../controllers/auth/auth.controller.js';

const router = express.Router();
const authController = new AuthController();

// Public endpoints
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Private endpoints (requieren auth)
router.post('/logout', authController.logout); // TODO: agregar middleware de auth
router.get('/me', authController.getMe);
router.patch('/me', authController.updateMe);
router.post('/change-password', authController.changePassword);
router.delete('/me', authController.deleteMe);

export default router;
