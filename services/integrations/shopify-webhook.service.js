import axios from 'axios';
import crypto from 'crypto';

class ShopifyWebhookService {
  async registerWebhooks(shopifyStore, accessToken) {
    try {
      const webhooks = [
        { topic: 'products/update', address: `${process.env.WEBHOOK_URL}/api/webhooks/integrations/shopify` },
        { topic: 'products/delete', address: `${process.env.WEBHOOK_URL}/api/webhooks/integrations/shopify` }
      ];

      const results = [];

      for (const webhook of webhooks) {
        try {
          const response = await axios.post(
            `https://${shopifyStore}/admin/api/2024-01/graphql.json`,
            {
              query: `mutation CreateWebhook($input: WebhookSubscriptionInput!) {
                webhookSubscriptionCreate(input: $input) {
                  userErrors { field message }
                  webhookSubscription {
                    id
                    topic
                    endpoint { url }
                  }
                }
              }`,
              variables: {
                input: {
                  topic: webhook.topic,
                  webhookSubscription: {
                    format: 'JSON',
                    address: webhook.address
                  }
                }
              }
            },
            {
              headers: {
                'X-Shopify-Access-Token': accessToken,
                'Content-Type': 'application/json'
              }
            }
          );

          if (response.data?.data?.webhookSubscriptionCreate?.webhookSubscription) {
            results.push({ topic: webhook.topic, success: true, id: response.data.data.webhookSubscriptionCreate.webhookSubscription.id });
            console.log(`✅ Shopify webhook registered: ${webhook.topic}`);
          } else {
            const errors = response.data?.data?.webhookSubscriptionCreate?.userErrors;
            console.warn(`⚠️  Failed to register ${webhook.topic}:`, errors);
            results.push({ topic: webhook.topic, success: false, error: errors });
          }
        } catch (error) {
          console.error(`❌ Error registering webhook ${webhook.topic}:`, error.message);
          results.push({ topic: webhook.topic, success: false, error: error.message });
        }
      }

      return results;
    } catch (error) {
      console.error('Error in registerWebhooks:', error);
      throw error;
    }
  }

  generateWebhookSecret() {
    return crypto.randomBytes(32).toString('hex');
  }

  verifyShopifyWebhookSignature(hmacHeader, body, secret) {
    if (!secret) return false;
    const hash = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('base64');
    return hash === hmacHeader;
  }
}

export default new ShopifyWebhookService();
