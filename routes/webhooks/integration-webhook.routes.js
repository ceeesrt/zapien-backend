import express from 'express';
import IntegrationWebhookController from '../../controllers/webhooks/integration-webhook.controller.js';

const router = express.Router();

router.post('/shopify', IntegrationWebhookController.handleShopifyWebhook);
router.post('/woocommerce', IntegrationWebhookController.handleWooCommerceWebhook);

export default router;
