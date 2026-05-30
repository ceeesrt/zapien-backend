/**
 * RetrievalService
 * Maneja la recuperación inteligente de documentos para RAG
 *
 * Dependencias inyectadas:
 * - documentRepository: Acceso a datos
 * - embeddingService: Crear embeddings
 * - rankingService: Re-rankear resultados
 */

import RankingService from './ranking.service.js';
import logger from '../../utils/logger.js';

class RetrievalService {
  constructor(documentRepository, embeddingService) {
    this.documentRepository = documentRepository;
    this.embeddingService = embeddingService;
    this.rankingService = new RankingService();
  }

  /**
   * Recuperar contexto relevante para una pregunta
   */
  retrieveContext = async (userId, chatbotId, query, options = {}) => {
    try {
      const {
        topK = 5,
        minScore = 0.6,
        includeKeywordSearch = true,
        diversify = true
      } = options;

      logger.info('🔍 Recuperando contexto', {
        userId,
        chatbotId,
        query: query.substring(0, 50) + '...'
      });

      // 1. Búsqueda semántica
      const semanticResults = await this.semanticSearch(
        userId,
        chatbotId,
        query,
        topK * 2
      );

      logger.debug('Resultados semánticos:', semanticResults.length);

      // 2. Búsqueda por palabras clave (opcional)
      let keywordResults = [];
      if (includeKeywordSearch) {
        keywordResults = await this.keywordSearch(
          userId,
          chatbotId,
          query,
          topK
        );
        logger.debug('Resultados por keywords:', keywordResults.length);
      }

      // 3. Fusionar y re-rankear
      if (semanticResults.length === 0 && keywordResults.length === 0) {
        logger.warn('⚠️ No se encontraron resultados', {
          userId,
          chatbotId,
          query
        });
        return {
          results: [],
          message: 'No se encontró información relevante',
          totalFound: 0
        };
      }

      const ranked = this.rankingService.rankAndFilter(
        semanticResults,
        keywordResults,
        query,
        {
          minScore,
          topK,
          diversify
        }
      );

      logger.info('✅ Contexto recuperado', {
        found: ranked.results.length,
        totalAvailable: ranked.totalFound
      });

      return {
        results: ranked.results,
        message: ranked.message,
        totalFound: ranked.totalFound,
        minScore: minScore,
        query: query
      };

    } catch (error) {
      logger.error('❌ Error recuperando contexto:', error);
      return {
        results: [],
        error: error.message,
        totalFound: 0
      };
    }
  };

  /**
   * Búsqueda semántica usando embeddings
   */
  semanticSearch = async (userId, chatbotId, query, limit = 10) => {
    try {
      // Crear embedding de la pregunta
      const queryEmbedding = await this.embeddingService.createEmbedding(
        query,
        { userId }
      );

      if (!queryEmbedding || queryEmbedding.length === 0) {
        throw new Error('No se pudo crear embedding de la pregunta');
      }

      // Buscar en la base de datos
      const results = await this.documentRepository.searchByEmbedding(
        userId,
        chatbotId,
        queryEmbedding,
        limit
      );

      return results.map(r => ({
        text: r.text,
        source: r.source,
        category: r.category || 'OTHER',
        importance: r.importance || 'medium',
        tokens: r.tokens || 0,
        similarityScore: r.similarityScore || 0
      }));

    } catch (error) {
      logger.error('Error en búsqueda semántica:', error);
      return [];
    }
  };

  /**
   * Búsqueda por palabras clave
   */
  keywordSearch = async (userId, chatbotId, query, limit = 10) => {
    try {
      const keywords = this.rankingService.extractKeywords(query);

      if (keywords.length === 0) {
        return [];
      }

      // Construir regex para búsqueda
      const regexPattern = keywords.map(kw => `(?=.*${this.escapeRegex(kw)})`).join('');

      // Buscar en MongoDB
      const Document = require('../../models/Document.js').default;
      const results = await Document.aggregate([
        {
          $match: {
            userId,
            chatbotId,
            status: 'ready'
          }
        },
        {
          $unwind: '$chunks'
        },
        {
          $match: {
            'chunks.text': {
              $regex: regexPattern,
              $options: 'i'
            }
          }
        },
        {
          $project: {
            text: '$chunks.text',
            source: '$originalFile.name',
            category: '$chunks.metadata.category',
            importance: '$chunks.metadata.importance',
            tokens: '$chunks.tokens',
            keywordScore: { $literal: 0.8 }
          }
        },
        { $limit: limit }
      ]);

      return results;

    } catch (error) {
      logger.error('Error en búsqueda por keywords:', error);
      return [];
    }
  };

  /**
   * Obtener documentos por categoría
   */
  getDocumentsByCategory = async (userId, chatbotId, category) => {
    try {
      return await this.documentRepository.getChunksByCategory(
        userId,
        chatbotId,
        category
      );
    } catch (error) {
      logger.error(`Error obteniendo documentos de ${category}:`, error);
      return [];
    }
  };

  /**
   * Buscar con parámetros avanzados
   */
  advancedSearch = async (userId, chatbotId, query, filters = {}) => {
    try {
      const {
        category = null,
        importance = null,
        limit = 5,
        minScore = 0.6
      } = filters;

      // Búsqueda base
      let context = await this.retrieveContext(userId, chatbotId, query, {
        topK: limit * 2,
        minScore
      });

      // Filtrar por categoría si se especifica
      if (category && context.results.length > 0) {
        context.results = context.results.filter(r => r.category === category);
      }

      // Filtrar por importancia si se especifica
      if (importance && context.results.length > 0) {
        context.results = context.results.filter(r => r.importance === importance);
      }

      // Limitar a topK
      context.results = context.results.slice(0, limit);

      return context;

    } catch (error) {
      logger.error('Error en búsqueda avanzada:', error);
      return { results: [], error: error.message };
    }
  };

  /**
   * Helper: Escapar regex
   */
  escapeRegex = (str) => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  /**
   * Obtener estadísticas de búsqueda
   */
  getSearchStats = async (userId, chatbotId) => {
    try {
      return await this.documentRepository.getDocumentStats(userId, chatbotId);
    } catch (error) {
      logger.error('Error obteniendo estadísticas:', error);
      return null;
    }
  };
}

export default RetrievalService;
