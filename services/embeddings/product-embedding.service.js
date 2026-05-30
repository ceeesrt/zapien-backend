import OpenAI from 'openai';
import logger from '../../utils/logger.js';

class ProductEmbeddingService {
  constructor() {
    this.modelName = 'text-embedding-3-small';
    this.embeddingDimension = 1536;
  }

  /**
   * Crea un texto optimizado para embedding del producto
   * Combina name, description, category y tags en un texto conciso
   */
  buildEmbeddingText(product) {
    const parts = [
      product.name,
      product.description ? `Descripción: ${product.description}` : '',
      product.category ? `Categoría: ${product.category}` : '',
      product.tags?.length ? `Tags: ${product.tags.join(', ')}` : ''
    ].filter(Boolean);

    return parts.join('. ').substring(0, 500);
  }

  /**
   * Genera embedding usando OpenAI para un producto
   */
  async generateEmbedding(product, openaiApiKey) {
    try {
      if (!openaiApiKey) {
        logger.warn('OpenAI API key not provided for product embedding', {
          productId: product._id,
          productName: product.name
        });
        return null;
      }

      const embeddingText = this.buildEmbeddingText(product);

      const client = new OpenAI({ apiKey: openaiApiKey });

      const response = await client.embeddings.create({
        model: this.modelName,
        input: embeddingText,
        encoding_format: 'float',
        dimensions: this.embeddingDimension
      });

      if (!response.data || response.data.length === 0) {
        logger.error('No embedding data returned from OpenAI', {
          productId: product._id
        });
        return null;
      }

      logger.info('Product embedding generated', {
        productId: product._id,
        productName: product.name,
        textLength: embeddingText.length
      });

      return {
        embedding: response.data[0].embedding,
        embeddingText,
        embeddingModel: this.modelName
      };
    } catch (error) {
      logger.error('Error generating product embedding', {
        error: error.message,
        productId: product._id,
        productName: product.name
      });
      return null;
    }
  }

  /**
   * Genera embeddings para múltiples productos en batch
   */
  async generateEmbeddingsBatch(products, openaiApiKey) {
    try {
      if (!openaiApiKey || !products || products.length === 0) {
        return [];
      }

      const client = new OpenAI({ apiKey: openaiApiKey });

      const embeddingTexts = products.map(p => this.buildEmbeddingText(p));

      const response = await client.embeddings.create({
        model: this.modelName,
        input: embeddingTexts,
        encoding_format: 'float',
        dimensions: this.embeddingDimension
      });

      const result = response.data.map((data, idx) => ({
        productId: products[idx]._id,
        embedding: data.embedding,
        embeddingText: embeddingTexts[idx],
        embeddingModel: this.modelName
      }));

      logger.info('Batch product embeddings generated', {
        count: result.length
      });

      return result;
    } catch (error) {
      logger.error('Error generating batch embeddings', {
        error: error.message,
        productsCount: products?.length
      });
      return [];
    }
  }
}

export default new ProductEmbeddingService();
