import BaseIntegrationAdapter from './base.adapter.js';
import axios from 'axios';

class ShopifyAdapter extends BaseIntegrationAdapter {
  constructor(credentials) {
    super(credentials);
    this.baseUrl = `https://${credentials.shopifyStore}/admin/api/2024-01/graphql.json`;
    this.headers = {
      'X-Shopify-Access-Token': credentials.accessToken,
      'Content-Type': 'application/json'
    };
  }

  async fetchProducts() {
    try {
      const products = [];
      let hasNextPage = true;
      let cursor = null;

      while (hasNextPage) {
        const query = this.buildProductQuery(cursor);
        const response = await axios.post(this.baseUrl, { query }, { headers: this.headers });

        if (response.data.errors) {
          throw new Error(`Shopify GraphQL error: ${response.data.errors[0].message}`);
        }

        const pageProducts = response.data.data.products.edges.map(edge => {
          const node = edge.node;
          const variant = node.variants.edges[0]?.node;
          
          return this.normalizeProduct({
            id: node.id,
            sku: variant?.sku || node.legacyResourceId,
            name: node.title,
            description: node.bodyHtml,
            price: variant?.price || 0,
            currency: 'USD',
            imageUrl: node.featuredImage?.url,
            category: node.productType || '',
            tags: node.tags,
            stock: variant?.inventoryQuantity || 0,
            url: `https://${this.credentials.shopifyStore}/products/${node.handle}`
          });
        });

        products.push(...pageProducts);

        const pageInfo = response.data.data.products.pageInfo;
        hasNextPage = pageInfo.hasNextPage;
        cursor = pageInfo.endCursor;
      }

      return products;
    } catch (error) {
      throw new Error(`Failed to fetch Shopify products: ${error.message}`);
    }
  }

  buildProductQuery(cursor) {
    const first = 50;
    const after = cursor ? `, after: "${cursor}"` : '';

    return `
      query {
        products(first: ${first}${after}) {
          edges {
            node {
              id
              legacyResourceId
              title
              bodyHtml
              productType
              handle
              tags
              featuredImage {
                url
              }
              variants(first: 1) {
                edges {
                  node {
                    sku
                    price
                    inventoryQuantity
                  }
                }
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;
  }
}

export default ShopifyAdapter;
