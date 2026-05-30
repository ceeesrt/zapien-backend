import BaseIntegrationAdapter from './base.adapter.js';
import axios from 'axios';
import crypto from 'crypto';

class JumpsellerAdapter extends BaseIntegrationAdapter {
  constructor(credentials) {
    super(credentials);
    this.baseUrl = 'https://api.jumpseller.com/v1';
    this.apiKey = credentials.apiKey;
    this.apiSecret = credentials.apiSecret;
  }

  generateSignature(method, path) {
    const timestamp = Math.floor(Date.now() / 1000);
    const stringToSign = `${method}\n${path}\n${this.apiKey}\n${timestamp}`;
    const signature = crypto
      .createHmac('sha256', this.apiSecret)
      .update(stringToSign)
      .digest('hex');
    
    return { signature, timestamp };
  }

  async fetchProducts() {
    try {
      const products = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const path = `/products?page=${page}&limit=100`;
        const { signature, timestamp } = this.generateSignature('GET', path);

        const response = await axios.get(`${this.baseUrl}${path}`, {
          headers: {
            'X-Jumpseller-API-Key': this.apiKey,
            'X-Jumpseller-Timestamp': timestamp,
            'X-Jumpseller-Signature': signature
          }
        });

        if (!response.data || !response.data.products) {
          hasMore = false;
          break;
        }

        const pageProducts = response.data.products.map(product =>
          this.normalizeProduct({
            id: product.id,
            sku: product.code || product.id,
            name: product.name,
            description: product.description || '',
            price: parseFloat(product.price),
            currency: product.currency || 'CLP',
            imageUrl: product.thumbnail_url,
            category: product.category || '',
            tags: product.tags || [],
            stock: product.stock || 0,
            url: product.url
          })
        );

        products.push(...pageProducts);

        page += 1;
        hasMore = response.data.pagination?.has_next_page || false;
      }

      return products;
    } catch (error) {
      throw new Error(`Failed to fetch Jumpseller products: ${error.message}`);
    }
  }
}

export default JumpsellerAdapter;
