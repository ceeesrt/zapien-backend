import WebhookService from '../../services/webhooks/webhook.service.js';

const webhookService = new WebhookService();

export default class WebhookController {
    mercadopago = async (req, res) => {
        try {
            const response = await webhookService.handleMercadoPagoNotification(req.body);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ WebhookController.mercadopago:', error);
            return res.status(500).json({
                success: false,
                message: 'Error procesando webhook'
            });
        }
    };

    googleCalendar = async (req, res) => {
        try {
            const response = await webhookService.handleGoogleCalendarNotification(req.body);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ WebhookController.googleCalendar:', error);
            return res.status(500).json({
                success: false,
                message: 'Error procesando webhook'
            });
        }
    };
}
