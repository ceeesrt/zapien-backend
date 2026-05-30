import express from 'express';
import ChatbotConfigController from '../controllers/config/chatbot-config.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router({ mergeParams: true });

// Todos los endpoints requieren autenticación
router.use(authMiddleware);

/**
 * GET /api/workspaces/:workspaceId/chatbots/:chatbotId/config
 * Obtener configuración completa (empresa + instrucciones)
 */
router.get('/', ChatbotConfigController.getConfig);

/**
 * POST /api/workspaces/:workspaceId/chatbots/:chatbotId/config
 * Guardar configuración (empresa + instrucciones)
 */
router.post('/', ChatbotConfigController.saveConfig);

/**
 * GET /api/workspaces/:workspaceId/chatbots/:chatbotId/system-prompt
 * Obtener system prompt construido dinámicamente
 */
router.get('/system-prompt', ChatbotConfigController.getSystemPrompt);

export default router;
