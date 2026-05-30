import express from 'express';
import SocialController from '../../controllers/messaging/social.controller.js';

const router = express.Router();
const socialController = new SocialController();

// WhatsApp webhooks (Twilio)
router.post('/whatsapp/webhook', socialController.handleWhatsAppWebhook);

// Instagram webhooks (Meta)
router.post('/instagram/webhook', socialController.handleInstagramWebhook);
router.get('/instagram/webhook', socialController.verifyInstagramWebhook);

// Obtener estado de integraciones
router.get('/chatbots/:chatbotId/integrations/status', socialController.getIntegrationStatus);

export default router;
