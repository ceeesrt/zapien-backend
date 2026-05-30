import BaseIntegrationAdapter from './base.adapter.js';
import axios from 'axios';

class CustomApiAdapter extends BaseIntegrationAdapter {
  constructor(credentials) {
    super(credentials);
    this.baseUrl = credentials.apiUrl;
    this.authHeader = credentials.authHeader; // e.g., "Bearer token" or "ApiKey secret"
  }

  async fetchProducts() {
    try {
      const headers = {};

      if (this.authHeader) {
        const [authType, authValue] = this.authHeader.split(' ');
        if (authType.toLowerCase() === 'bearer') {
          headers['Authorization'] = `Bearer ${authValue}`;
        } else if (authType.toLowerCase() === 'apikey') {
          headers['X-API-Key'] = authValue;
        } else {
          headers['Authorization'] = this.authHeader;
        }
      }

      const response = await axios.get(`${this.baseUrl}/products`, { headers });

      if (!Array.isArray(response.data)) {
        // If response is wrapped, try common wrappers
        if (response.data.products && Array.isArray(response.data.products)) {
          return response.data.products.map(p => this.normalizeProduct(p));
        }
        if (response.data.data && Array.isArray(response.data.data)) {
          return response.data.data.map(p => this.normalizeProduct(p));
        }
        throw new Error('Response is not an array of products');
      }

      return response.data.map(product => this.normalizeProduct(product));
    } catch (error) {
      throw new Error(`Failed to fetch products from custom API: ${error.message}`);
    }
  }
}

export default CustomApiAdapter;
