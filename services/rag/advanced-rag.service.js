import { OpenAI } from 'openai';
import { encodingForModel } from 'js-tiktoken';
import DocumentChunk from '../../models/DocumentChunk.js';
import Product from '../../models/Product.js';
import logger from '../../utils/logger.js';

let openai = null;

const enc = encodingForModel('gpt-3.5-turbo');

const CONFIG = {
  MAX_CONTEXT_TOKENS: 2000,
  MAX_CHUNKS: 5,
  EMBEDDING_MODEL: 'text-embedding-3-small',
  SIMILARITY_THRESHOLD: 0.5,
  CACHE_TTL: 3600 // 1 hora
};

export default class AdvancedRAGService {
  constructor() {
    this.cache = new Map();
    this.embeddingCache = new Map();
  }

  /**
   * Busca documentos usando embeddings semánticos
   */
  async searchDocumentsBySemantics(chatbotId, query, limit = 5) {
    try {
      // 1. Obtener embedding de la query
      const queryEmbedding = await this.getEmbedding(query);
      if (!queryEmbedding) {
        throw new Error('No se pudo generar embedding de la query');
      }

      // 2. Buscar en MongoDB usando Vector Search
      const chunks = await DocumentChunk.aggregate([
        {
          $search: {
            cosmosSearch: {
              vector: queryEmbedding,
              k: limit
            },
            returnScoreDetails: 'cosineSimScore'
          }
        },
        {
          $match: {
            chatbotId: chatbotId
          }
        },
        {
          $project: {
            chunkId: '$_id',
            content: 1,
            source: 1,
            docId: 1,
            similarity: { $meta: 'searchScore' }
          }
        },
        {
          $limit: limit
        }
      ]).exec();

      // 3. Filtrar por threshold de relevancia
      const relevantChunks = chunks.filter(chunk =>
        chunk.similarity >= CONFIG.SIMILARITY_THRESHOLD
      );

      logger.info('RAG Search', {
        chatbotId,
        query,
        resultsFound: relevantChunks.length,
        avgSimilarity: relevantChunks.length > 0
          ? (relevantChunks.reduce((sum, c) => sum + c.similarity, 0) / relevantChunks.length).toFixed(3)
          : 0
      });

      return relevantChunks;
    } catch (error) {
      logger.error('Error en semantic search', { error: error.message, chatbotId, query });
      // Fallback a búsqueda simple
      return await this.searchDocumentsByKeyword(chatbotId, query, limit);
    }
  }

  /**
   * Búsqueda por palabras clave (fallback)
   */
  async searchDocumentsByKeyword(chatbotId, query, limit = 5) {
    try {
      const searchRegex = new RegExp(query.split(' ').join('|'), 'i');

      const chunks = await DocumentChunk.find({
        chatbotId,
        content: searchRegex
      })
      .limit(limit)
      .lean();

      return chunks.map(chunk => ({
        chunkId: chunk._id,
        content: chunk.content,
        source: chunk.source,
        docId: chunk.docId,
        similarity: 0.5 // Score por defecto
      }));
    } catch (error) {
      logger.error('Error en keyword search', { error: error.message, chatbotId, query });
      return [];
    }
  }

  /**
   * Obtiene embedding de un texto (con cacheo)
   */
  async getEmbedding(text) {
    try {
      // Verificar cache
      if (this.embeddingCache.has(text)) {
        const cached = this.embeddingCache.get(text);
        if (Date.now() - cached.timestamp < CONFIG.CACHE_TTL * 1000) {
          logger.debug('Embedding desde cache', { text: text.substring(0, 50) });
          return cached.embedding;
        }
      }

      // Inicializar OpenAI si no está listo
      if (!openai) {
        openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        });
      }

      // Obtener embedding de OpenAI
      const response = await openai.embeddings.create({
        input: text,
        model: CONFIG.EMBEDDING_MODEL
      });

      const embedding = response.data[0].embedding;

      // Cachear resultado
      this.embeddingCache.set(text, {
        embedding,
        timestamp: Date.now()
      });

      logger.info('Embedding generado', {
        text: text.substring(0, 50),
        tokenUsage: response.usage.prompt_tokens
      });

      return embedding;
    } catch (error) {
      logger.error('Error generando embedding', { error: error.message, text: text.substring(0, 50) });
      return null;
    }
  }

  /**
   * Busca productos relevantes
   */
  /**
   * Busca productos usando embeddings semánticos inteligentes
   * Fallback a búsqueda por palabras clave si no hay embeddings
   */
  async searchProducts(chatbotId, query, limit = 3) {
    try {
      // Intentar búsqueda vectorial inteligente primero
      const vectorResults = await this.searchProductsByVector(chatbotId, query, limit);
      if (vectorResults.length > 0) {
        return vectorResults;
      }

      // Fallback a búsqueda por palabras clave
      logger.debug('Falling back to keyword search for products', { chatbotId, query });
      return await this.searchProductsByKeyword(chatbotId, query, limit);
    } catch (error) {
      logger.error('Error buscando productos', { error: error.message, chatbotId, query });
      // Último recurso: búsqueda por palabras clave
      return await this.searchProductsByKeyword(chatbotId, query, limit);
    }
  }

  /**
   * Búsqueda inteligente de productos usando embeddings vectoriales
   */
  async searchProductsByVector(chatbotId, query, limit = 3) {
    try {
      // 1. Obtener embedding de la query
      const queryEmbedding = await this.getEmbedding(query);
      if (!queryEmbedding) {
        logger.debug('Could not generate embedding for product search');
        return [];
      }

      // 2. Buscar productos con embeddings usando Vector Search
      const products = await Product.aggregate([
        {
          $search: {
            cosmosSearch: {
              vector: queryEmbedding,
              k: limit
            },
            returnScoreDetails: 'cosineSimScore'
          }
        },
        {
          $match: {
            chatbotId,
            embedding: { $exists: true, $ne: null }
          }
        },
        {
          $project: {
            _id: 1,
            name: 1,
            description: 1,
            price: 1,
            sku: 1,
            stock: 1,
            category: 1,
            tags: 1,
            imageUrl: 1,
            similarity: { $meta: 'searchScore' }
          }
        },
        {
          $limit: limit
        }
      ]).exec();

      logger.info('Product vector search', {
        chatbotId,
        query,
        resultsFound: products.length,
        avgSimilarity: products.length > 0
          ? (products.reduce((sum, p) => sum + (p.similarity || 0), 0) / products.length).toFixed(3)
          : 0
      });

      return products;
    } catch (error) {
      logger.debug('Vector search failed, will use keyword search', {
        error: error.message,
        chatbotId
      });
      return [];
    }
  }

  /**
   * Búsqueda por palabras clave para productos (fallback)
   */
  async searchProductsByKeyword(chatbotId, query, limit = 3) {
    try {
      const searchRegex = new RegExp(query.split(' ').join('|'), 'i');

      const products = await Product.find({
        chatbotId,
        $or: [
          { name: searchRegex },
          { description: searchRegex },
          { tags: searchRegex }
        ]
      })
      .limit(limit)
      .select('name description price sku stock category tags imageUrl')
      .lean();

      logger.debug('Product keyword search', {
        chatbotId,
        query,
        resultsFound: products.length
      });

      return products;
    } catch (error) {
      logger.error('Keyword search for products failed', {
        error: error.message,
        chatbotId,
        query
      });
      return [];
    }
  }

  /**
   * Construye contexto optimizado para OpenAI
   */
  buildContext(chunks, products, customPrompt) {
    try {
      let context = '';
      let tokenCount = 0;

      // Agregar documentos
      if (chunks && chunks.length > 0) {
        context += 'INFORMACIÓN DE LA EMPRESA (Documentos):\n';
        context += '=====================================\n\n';

        for (const chunk of chunks) {
          const chunkContent = `Fuente: ${chunk.source}\nContenido: ${chunk.content}\n---\n`;
          const chunkTokens = enc.encode(chunkContent).length;

          // Verificar si cabe en el límite
          if (tokenCount + chunkTokens > CONFIG.MAX_CONTEXT_TOKENS) {
            logger.warn('Contexto excede límite de tokens', {
              currentTokens: tokenCount,
              chunkTokens,
              limit: CONFIG.MAX_CONTEXT_TOKENS
            });
            break;
          }

          context += chunkContent;
          tokenCount += chunkTokens;
        }
      }

      // Agregar productos
      if (products && products.length > 0) {
        context += '\nCATÁLOGO DE PRODUCTOS DISPONIBLES:\n';
        context += '==================================\n\n';

        for (const product of products) {
          let productText = `Producto: ${product.name}\n`;
          if (product.description) productText += `Descripción: ${product.description}\n`;
          productText += `Precio: $${product.price || 'N/A'} (${product.category || 'Sin categoría'})\n`;
          productText += `Stock: ${product.stock > 0 ? product.stock + ' unidades' : 'No disponible'}\n`;
          if (product.tags && product.tags.length > 0) {
            productText += `Tags: ${product.tags.join(', ')}\n`;
          }
          if (product.similarity) {
            productText += `Relevancia: ${(product.similarity * 100).toFixed(0)}%\n`;
          }
          productText += '---\n';

          const productTokens = enc.encode(productText).length;

          if (tokenCount + productTokens > CONFIG.MAX_CONTEXT_TOKENS) {
            logger.warn('Catálogo excede límite de tokens', { productsIncluded: context.split('---').length - 1 });
            break;
          }

          context += productText;
          tokenCount += productTokens;
        }
      }

      logger.info('Contexto construido', {
        totalTokens: tokenCount,
        chunksIncluded: chunks ? chunks.length : 0,
        productsIncluded: products ? products.length : 0,
        customPromptIncluded: !!customPrompt
      });

      return context;
    } catch (error) {
      logger.error('Error construyendo contexto', { error: error.message });
      return '';
    }
  }

  /**
   * Cachea respuesta para queries similares
   */
  getCachedResponse(chatbotId, query) {
    const cacheKey = `${chatbotId}:${query}`;

    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < CONFIG.CACHE_TTL * 1000) {
        logger.info('Respuesta desde cache', { cacheKey: cacheKey.substring(0, 50) });
        return cached.response;
      }
    }

    return null;
  }

  /**
   * Cachea respuesta
   */
  cacheResponse(chatbotId, query, response) {
    const cacheKey = `${chatbotId}:${query}`;

    this.cache.set(cacheKey, {
      response,
      timestamp: Date.now()
    });

    // Limpiar cache si crece demasiado
    if (this.cache.size > 1000) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  /**
   * Valida cantidad de tokens
   */
  validateTokenCount(content, maxTokens = CONFIG.MAX_CONTEXT_TOKENS) {
    try {
      const tokens = enc.encode(content).length;

      if (tokens > maxTokens) {
        logger.warn('Token count exceeds limit', {
          tokens,
          limit: maxTokens,
          percentage: ((tokens / maxTokens) * 100).toFixed(1)
        });
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error validating token count', { error: error.message });
      return true; // Permitir si hay error
    }
  }

  /**
   * Limpia cache periódicamente
   */
  cleanupCache() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > CONFIG.CACHE_TTL * 1000) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    for (const [key, value] of this.embeddingCache.entries()) {
      if (now - value.timestamp > CONFIG.CACHE_TTL * 1000) {
        this.embeddingCache.delete(key);
        cleaned++;
      }
    }

    logger.debug('Cache cleanup', {
      itemsCleaned: cleaned,
      cacheSize: this.cache.size + this.embeddingCache.size
    });
  }

  /**
   * Obtiene estadísticas de RAG
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      embeddingCacheSize: this.embeddingCache.size,
      config: CONFIG
    };
  }
}
