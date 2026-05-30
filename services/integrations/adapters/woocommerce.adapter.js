import BaseIntegrationAdapter from './base.adapter.js';
import axios from 'axios';
import crypto from 'crypto';

class WooCommerceAdapter extends BaseIntegrationAdapter {
  constructor(credentials) {
    super(credentials);
    this.baseUrl = credentials.wcBaseUrl?.replace(/\/$/, '');
    this.consumerKey = credentials.wcConsumerKey;
    this.consumerSecret = credentials.wcConsumerSecret;
  }

  async fetchProducts() {
    try {
      const products = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const url = `${this.baseUrl}/wp-json/wc/v3/products?page=${page}&per_page=100`;
        const response = await this.makeWooRequest('GET', url);

        if (!response.data || response.data.length === 0) {
          hasMore = false;
          break;
        }

        const pageProducts = response.data.map((product) =>
          this.normalizeProduct({
            id: product.id,
            sku: product.sku || `wc-${product.id}`,
            name: product.name,
            description: product.description || product.short_description || '',
            price: parseFloat(product.price) || 0,
            currency: 'CLP', // WooCommerce typically uses shop currency
            imageUrl: product.images?.[0]?.src,
            category: product.categories?.[0]?.name || '',
            tags: product.tags?.map(t => t.name) || [],
            stock: product.stock_quantity || 0,
            url: product.permalink
          })
        );

        products.push(...pageProducts);
        page += 1;
      }

      return products;
    } catch (error) {
      throw new Error(`Failed to fetch WooCommerce products: ${error.message}`);
    }
  }

  async makeWooRequest(method, url, data = null) {
    try {
      const config = this.getWooAuthHeader(method, url);

      if (method === 'GET') {
        return await axios.get(url, config);
      } else if (method === 'POST') {
        return await axios.post(url, data, config);
      }
    } catch (error) {
      console.error(`WooCommerce API error: ${error.message}`);
      throw error;
    }
  }

  getWooAuthHeader(method, url) {
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = crypto.randomBytes(8).toString('hex');

    const parsedUrl = new URL(url);
    const params = new URLSearchParams(parsedUrl.search);

    params.append('oauth_consumer_key', this.consumerKey);
    params.append('oauth_nonce', nonce);
    params.append('oauth_signature_method', 'HMAC-SHA256');
    params.append('oauth_timestamp', timestamp);
    params.append('oauth_version', '1.0');

    const baseString = this.buildSignatureBaseString(method, url, params);
    const signature = this.generateSignature(baseString);

    return {
      headers: {
        Authorization: this.buildAuthHeader(params, signature),
      },
    };
  }

  buildSignatureBaseString(method, url, params) {
    const baseUrl = url.split('?')[0];
    const sortedParams = new URLSearchParams(params);
    const paramString = sortedParams.toString();
    return `${method}&${encodeURIComponent(baseUrl)}&${encodeURIComponent(paramString)}`;
  }

  generateSignature(baseString) {
    const key = `${this.consumerSecret}&`;
    return crypto
      .createHmac('sha256', key)
      .update(baseString)
      .digest('base64');
  }

  buildAuthHeader(params, signature) {
    const oauthParams = ['oauth_consumer_key', 'oauth_nonce', 'oauth_signature_method', 'oauth_timestamp', 'oauth_version'];
    const authParams = oauthParams.map(key => `${key}="${params.get(key)}"`).join(', ');
    return `OAuth ${authParams}, oauth_signature="${encodeURIComponent(signature)}"`;
  }
}

export default WooCommerceAdapter;
