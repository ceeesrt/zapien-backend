class BaseIntegrationAdapter {
  constructor(credentials) {
    this.credentials = credentials;
  }

  async fetchProducts() {
    throw new Error('fetchProducts() must be implemented');
  }

  normalizeProduct(externalProduct) {
    return {
      sku: externalProduct.sku || externalProduct.id,
      name: externalProduct.name,
      description: externalProduct.description || '',
      price: parseFloat(externalProduct.price) || 0,
      currency: externalProduct.currency || 'CLP',
      imageUrl: externalProduct.imageUrl || externalProduct.image,
      category: externalProduct.category || '',
      tags: externalProduct.tags || [],
      externalId: externalProduct.id,
      externalUrl: externalProduct.url || null,
      stock: parseInt(externalProduct.stock) || 0
    };
  }

  validateProduct(product) {
    const errors = [];
    if (!product.sku) errors.push('Missing SKU');
    if (!product.name) errors.push('Missing name');
    if (!product.price || product.price <= 0) errors.push('Invalid price');
    return errors;
  }
}

export default BaseIntegrationAdapter;
