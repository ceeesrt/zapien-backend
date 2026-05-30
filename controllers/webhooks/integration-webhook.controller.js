import Integration from '../../models/Integration.js';
import { enqueueIntegrationSync } from '../../services/queue/sync-processor.js';
import crypto from 'crypto';

class IntegrationWebhookController {
  async handleShopifyWebhook(req, res) {
    try {
      const shopifyStore = req.query.store;
      const hmacHeader = req.headers['x-shopify-hmac-sha256'];
      const body = req.rawBody;

      if (!hmacHeader || !this.verifyShopifyWebhook(hmacHeader, body)) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const integration = await Integration.findOne({
        type: 'shopify',
        'credentials.shopifyStore': shopifyStore,
        isActive: true
      });

      if (!integration) {
        return res.status(404).json({ success: false, message: 'Integration not found' });
      }

      await enqueueIntegrationSync(integration._id);
      res.json({ success: true, message: 'Sync queued' });
    } catch (error) {
      console.error('Shopify webhook error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async handleWooCommerceWebhook(req, res) {
    try {
      const signature = req.headers['x-wc-webhook-signature'];
      const topic = req.headers['x-wc-webhook-topic'];
      const body = req.rawBody;

      const integration = await Integration.findOne({
        type: 'woocommerce',
        isActive: true
      });

      if (!integration || !this.verifyWooCommerceWebhook(signature, body, integration.webhookSecret)) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      if (topic && (topic.includes('product') || topic.includes('order'))) {
        await enqueueIntegrationSync(integration._id);
      }

      res.json({ success: true, message: 'Webhook processed' });
    } catch (error) {
      console.error('WooCommerce webhook error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  verifyShopifyWebhook(hmacHeader, body) {
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET || 'dev-secret';
    const hash = crypto
      .createHmac('sha256', secret)
      .update(body, 'utf8')
      .digest('base64');

    return hash === hmacHeader;
  }

  verifyWooCommerceWebhook(signature, body, webhookSecret) {
    if (!webhookSecret) return false;

    const hash = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('base64');

    return hash === signature;
  }
}

export default new IntegrationWebhookController();
