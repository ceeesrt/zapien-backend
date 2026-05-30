import express from 'express';
import WebhookController from '../../controllers/webhooks/webhook.controller.js';
import IntegrationWebhookController from '../../controllers/webhooks/integration-webhook.controller.js';

const router = express.Router();
const webhookController = new WebhookController();

// Public endpoints (no auth required)
router.post('/mercadopago', webhookController.mercadopago);
router.post('/google-calendar', webhookController.googleCalendar);

// Integration webhooks (public, verified via HMAC)
router.post('/integrations/shopify', IntegrationWebhookController.handleShopifyWebhook);
router.post('/integrations/woocommerce', IntegrationWebhookController.handleWooCommerceWebhook);

export default router;
