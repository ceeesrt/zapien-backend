import axios from 'axios';
import IntegrationService from '../../services/integrations/integration.service.js';

class ShopifyOAuthController {
  async handleCallback(req, res) {
    try {
      const { code, shop, state } = req.query;

      if (!code || !shop) {
        return res.status(400).json({ success: false, message: 'Missing code or shop' });
      }

      // Validate state (should contain workspaceId:chatbotId)
      if (!state) {
        return res.status(400).json({ success: false, message: 'Invalid state parameter' });
      }

      const [workspaceId, chatbotId, userId] = state.split(':');

      if (!workspaceId || !chatbotId || !userId) {
        return res.status(400).json({ success: false, message: 'Invalid state format' });
      }

      // Exchange code for access token
      const accessToken = await this.getAccessToken(shop, code);

      if (!accessToken) {
        return res.status(400).json({ success: false, message: 'Failed to get access token' });
      }

      // Connect integration
      const result = await IntegrationService.connect(
        workspaceId,
        chatbotId,
        'shopify',
        {
          shopifyStore: shop,
          accessToken
        },
        userId
      );

      if (result.success) {
        // Redirect to success page (frontend)
        return res.redirect(`/dashboard/chatbots/${chatbotId}/catalog?integration=success`);
      } else {
        return res.redirect(`/dashboard/chatbots/${chatbotId}/catalog?integration=error&message=${encodeURIComponent(result.message)}`);
      }
    } catch (error) {
      console.error('Shopify OAuth callback error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getAccessToken(shop, code) {
    try {
      const response = await axios.post(`https://${shop}/admin/oauth/access_token`, {
        client_id: process.env.SHOPIFY_CLIENT_ID,
        client_secret: process.env.SHOPIFY_CLIENT_SECRET,
        code
      });

      return response.data?.access_token;
    } catch (error) {
      console.error('Error getting Shopify access token:', error);
      return null;
    }
  }
}

export default new ShopifyOAuthController();
