/**
 * RankingService
 * Realiza re-ranking inteligente de resultados de búsqueda
 */

class RankingService {

  /**
   * Fusionar y re-rankear resultados de búsqueda semántica y por palabras clave
   */
  mergeAndRerank = (semanticResults, keywordResults, query) => {
    const merged = new Map();

    // Agregar resultados semánticos
    semanticResults.forEach((result, idx) => {
      const key = result.text;
      merged.set(key, {
        text: result.text,
        category: result.category,
        importance: result.importance,
        source: result.source,
        tokens: result.tokens,
        semanticScore: result.similarityScore || 0,
        keywordScore: 0,
        finalScore: 0
      });
    });

    // Actualizar con resultados de palabras clave
    keywordResults.forEach((result) => {
      const key = result.text;
      if (merged.has(key)) {
        merged.get(key).keywordScore = result.keywordScore || 0.8;
      } else {
        merged.set(key, {
          text: result.text,
          category: result.category,
          importance: result.importance,
          source: result.source,
          tokens: result.tokens,
          semanticScore: 0,
          keywordScore: result.keywordScore || 0.8,
          finalScore: 0
        });
      }
    });

    // Calcular score final
    merged.forEach((result) => {
      let score =
        (result.semanticScore * 0.6) +      // Semántica: 60%
        (result.keywordScore * 0.4);        // Keywords: 40%

      // Boost por importancia
      if (result.importance === 'high') score *= 1.3;
      if (result.importance === 'medium') score *= 1.1;
      if (result.importance === 'low') score *= 0.9;

      // Boost por categoría relevante
      const relevantCategories = this.detectRelevantCategories(query);
      if (relevantCategories.includes(result.category)) {
        score *= 1.25;
      }

      result.finalScore = Math.min(score, 1.0);
    });

    // Retornar ordenados por score final
    return Array.from(merged.values())
      .sort((a, b) => b.finalScore - a.finalScore)
      .map(result => ({
        ...result,
        finalScore: Math.round(result.finalScore * 100) / 100
      }));
  };

  /**
   * Detectar categorías relevantes según la pregunta
   */
  detectRelevantCategories = (query) => {
    const lowerQuery = query.toLowerCase();
    const categories = [];

    const patterns = {
      PRICING: /precio|costo|valor|tarifa|cuánto cuesta|plan|pago|caro|barato|presupuesto/i,
      FEATURES: /característica|funcionalidad|qué|capacidad|permite|funciona|posibilidad|ventaja|beneficio/i,
      POLICIES: /política|término|condición|derecho|responsabilidad|privacidad|garantía|devolución/i,
      CONTACT: /teléfono|email|contacto|dirección|ubicación|número|atención|soporte/i,
      HOURS: /horario|abierto|cierra|disponible|servicio|horario|abierto|horarios de atención/i,
      PRODUCT: /producto|servicio|modelo|artículo|item|qué ofrece|que venden/i
    };

    Object.entries(patterns).forEach(([category, pattern]) => {
      if (pattern.test(lowerQuery)) {
        categories.push(category);
      }
    });

    return categories.length > 0 ? categories : [];
  };

  /**
   * Extraer palabras clave de la pregunta
   */
  extractKeywords = (query) => {
    const stopwords = [
      'el', 'la', 'de', 'que', 'es', 'y', 'a', 'en', 'un', 'una',
      'por', 'con', 'su', 'para', 'o', 'del', 'las', 'los', 'se',
      'cuál', 'cómo', 'cuándo', 'dónde', 'cuánto', 'quién', 'por qué',
      'esta', 'este', 'ese', 'esa', 'son', 'fue', 'era', 'el', 'la'
    ];

    const words = query
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopwords.includes(w));

    return words;
  };

  /**
   * Calcular relevancia de un documento para una consulta
   */
  calculateRelevance = (document, query) => {
    let relevance = 0;

    // 1. Longitud - documentos más largos suelen ser más informativos
    const wordCount = document.text.split(/\s+/).length;
    relevance += Math.min(wordCount / 100, 0.2); // Máximo 0.2

    // 2. Importancia del documento
    if (document.importance === 'high') relevance += 0.3;
    if (document.importance === 'medium') relevance += 0.15;
    if (document.importance === 'low') relevance += 0.05;

    // 3. Coincidencia de categoría
    const relevantCategories = this.detectRelevantCategories(query);
    if (relevantCategories.includes(document.category)) {
      relevance += 0.35;
    }

    // 4. Coincidencia de palabras clave
    const keywords = this.extractKeywords(query);
    const keywordMatches = keywords.filter(kw =>
      document.text.toLowerCase().includes(kw)
    ).length;
    relevance += Math.min((keywordMatches / keywords.length) * 0.1, 0.1);

    return Math.min(relevance, 1.0);
  };

  /**
   * Filtrar documentos por score mínimo
   */
  filterByScore = (results, minScore = 0.6) => {
    return results.filter(r => r.finalScore >= minScore);
  };

  /**
   * Diversificar resultados (no repetir sources)
   */
  diversify = (results, maxPerSource = 2) => {
    const sourceCount = {};
    const diversified = [];

    results.forEach(result => {
      if (!sourceCount[result.source]) {
        sourceCount[result.source] = 0;
      }

      if (sourceCount[result.source] < maxPerSource) {
        diversified.push(result);
        sourceCount[result.source]++;
      }
    });

    return diversified;
  };

  /**
   * Aplicar todos los filtros y mejoras
   */
  rankAndFilter = (semanticResults, keywordResults, query, options = {}) => {
    const {
      minScore = 0.6,
      topK = 5,
      maxPerSource = 2,
      diversify: shouldDiversify = true
    } = options;

    // 1. Fusionar y re-rankear
    let ranked = this.mergeAndRerank(semanticResults, keywordResults, query);

    // 2. Filtrar por score mínimo
    ranked = this.filterByScore(ranked, minScore);

    if (ranked.length === 0) {
      return {
        results: [],
        message: 'No se encontró información relevante'
      };
    }

    // 3. Diversificar si aplica
    if (shouldDiversify) {
      ranked = this.diversify(ranked, maxPerSource);
    }

    // 4. Tomar top K
    const topResults = ranked.slice(0, topK);

    return {
      results: topResults,
      totalFound: ranked.length,
      message: `Se encontraron ${ranked.length} documentos relevantes`
    };
  };
}

export default RankingService;
