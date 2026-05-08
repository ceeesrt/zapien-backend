import express from 'express';
import WebhookController from '../../controllers/webhooks/webhook.controller.js';

const router = express.Router();
const webhookController = new WebhookController();

// Public endpoints (no auth required)
router.post('/mercadopago', webhookController.mercadopago);
router.post('/google-calendar', webhookController.googleCalendar);

export default router;
