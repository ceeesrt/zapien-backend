/**
 * GenerationService
 * Genera respuestas usando OpenAI basadas en documentos recuperados
 *
 * Dependencias inyectadas:
 * - openaiClientService: Cliente de OpenAI
 * - retrievalService: Recuperar documentos
 * - promptBuilderService: Construir prompts
 * - analyticsService: Registrar eventos
 * - chatbotConfigService: Configuración del chatbot
 */

import logger from '../../utils/logger.js';
import ChatbotConfigService from '../config/chatbot-config.service.js';

class GenerationService {
  constructor(openaiClientService, retrievalService, promptBuilderService, analyticsService) {
    this.openaiClientService = openaiClientService;
    this.retrievalService = retrievalService;
    this.promptBuilderService = promptBuilderService;
    this.analyticsService = analyticsService;
    this.chatbotConfigService = ChatbotConfigService;
  }

  /**
   * Generar respuesta a un mensaje
   */
  generateResponse = async (userId, chatbotId, query, options = {}) => {
    try {
      const {
        conversationId = null,
        validateResponse = true,
        returnSources = true,
        model = 'gpt-3.5-turbo'
      } = options;

      logger.info('💬 Generando respuesta', {
        userId,
        chatbotId,
        query: query.substring(0, 50)
      });

      // 1. Obtener cliente OpenAI del usuario
      const userOpenAI = await this.openaiClientService.getUserClient(userId);
      if (!userOpenAI) {
        throw new Error('Usuario no tiene API key configurada');
      }

      // 2. Obtener chatbot
      const Chatbot = require('../../models/Chatbot.js').default;
      const chatbot = await Chatbot.findById(chatbotId);
      if (!chatbot) {
        throw new Error('Chatbot no encontrado');
      }

      // 3. Recuperar contexto
      const context = await this.retrievalService.retrieveContext(
        userId,
        chatbotId,
        query,
        { topK: 5 }
      );

      logger.debug('📚 Contexto recuperado:', context.results.length);

      // 4. Obtener system prompt dinámico (configuración + empresa + instrucciones)
      const systemPrompt = await this.chatbotConfigService.buildSystemPrompt(
        chatbot.workspaceId || chatbot.workspace,
        chatbotId
      );

      logger.debug('⚙️ System prompt dinámico obtenido');

      // 5. Construir prompt con system prompt personalizado
      const messages = this.promptBuilderService.buildMessages(
        chatbot,
        query,
        context.results,
        systemPrompt // ← Pasar el system prompt personalizado
      );

      // 5. Llamar a OpenAI
      const response = await userOpenAI.chat.completions.create({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 500,
        top_p: 0.9
      });

      const responseText = response.choices[0].message.content;

      logger.debug('✅ Respuesta generada');

      // 6. Validar respuesta (opcional)
      let isValid = true;
      if (validateResponse && context.results.length > 0) {
        isValid = await this.validateResponse(
          userOpenAI,
          responseText,
          context
        );

        if (!isValid) {
          logger.warn('⚠️ Respuesta no validada, posible alucinación');
        }
      }

      // 7. Registrar evento
      await this.analyticsService.logEvent({
        type: 'message_generated',
        userId,
        chatbotId,
        conversationId,
        queryLength: query.length,
        contextDocuments: context.results.length,
        responseLength: responseText.length,
        tokensUsed: response.usage.total_tokens,
        isValid
      });

      // 8. Armar respuesta
      const result = {
        text: isValid ? responseText : this.buildFallbackResponse(context),
        sources: returnSources ? context.results.map(r => r.source) : [],
        confidence: isValid ? 'high' : 'low',
        contextsUsed: context.results.length,
        usage: {
          completionTokens: response.usage.completion_tokens,
          promptTokens: response.usage.prompt_tokens,
          totalTokens: response.usage.total_tokens
        }
      };

      logger.info('✨ Respuesta completada', {
        confidence: result.confidence,
        tokens: result.usage.totalTokens
      });

      return result;

    } catch (error) {
      logger.error('❌ Error generando respuesta:', error);
      return {
        text: 'Disculpa, no pude procesar tu pregunta en este momento. Por favor intenta de nuevo más tarde.',
        sources: [],
        confidence: 'error',
        error: error.message
      };
    }
  };

  /**
   * Validar que la respuesta está basada en documentos
   */
  validateResponse = async (openaiClient, response, context) => {
    try {
      if (context.results.length === 0) {
        return false;
      }

      // Crear prompt de validación
      const validationMessages = [
        {
          role: 'system',
          content: 'Eres un validador de respuestas. Debes determinar si una respuesta está basada en la información proporcionada. Responde solo SÍ o NO.'
        },
        this.promptBuilderService.buildValidationPrompt(
          response,
          context.results
        )
      ];

      const validationResponse = await openaiClient.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: validationMessages,
        temperature: 0.3,
        max_tokens: 50
      });

      const validationText = validationResponse.choices[0].message.content.toLowerCase();
      return validationText.startsWith('sí') || validationText.startsWith('yes');

    } catch (error) {
      logger.warn('Error validando respuesta:', error);
      return true; // Si falla la validación, asumir que es válida
    }
  };

  /**
   * Respuesta fallback cuando no hay validación
   */
  buildFallbackResponse = (context) => {
    if (context.results.length === 0) {
      return 'No tengo información sobre eso en mis documentos. Por favor contacta con nuestro equipo para una respuesta más precisa.';
    }

    const sources = [...new Set(context.results.map(r => r.source))].join(', ');
    return `Basándome en la información disponible (${sources}), no puedo proporcionar una respuesta definitiva. Por favor contacta con nuestro equipo para obtener más detalles.`;
  };

  /**
   * Generar respuesta de clasificación
   */
  classifyQuery = async (userId, query) => {
    try {
      const userOpenAI = await this.openaiClientService.getUserClient(userId);
      if (!userOpenAI) {
        throw new Error('Usuario no tiene API key configurada');
      }

      const messages = [
        this.promptBuilderService.buildClassificationPrompt(query)
      ];

      const response = await userOpenAI.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages,
        temperature: 0.3,
        max_tokens: 50
      });

      const category = response.choices[0].message.content.trim().toUpperCase();
      return {
        query,
        category,
        tokens: response.usage.total_tokens
      };

    } catch (error) {
      logger.error('Error clasificando query:', error);
      return { query, category: 'OTHER', error: error.message };
    }
  };

  /**
   * Detectar alucinaciones
   */
  detectHallucinations = async (userId, response, sources) => {
    try {
      const userOpenAI = await this.openaiClientService.getUserClient(userId);
      if (!userOpenAI) {
        throw new Error('Usuario no tiene API key configurada');
      }

      const messages = [
        this.promptBuilderService.buildHallucinationDetectionPrompt(response, sources)
      ];

      const result = await userOpenAI.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages,
        temperature: 0.3,
        max_tokens: 100
      });

      const detection = result.choices[0].message.content;
      return {
        response: response.substring(0, 100) + '...',
        detection,
        isHallucination: detection.includes('ALUCINACIÓN'),
        isParcial: detection.includes('PARCIAL')
      };

    } catch (error) {
      logger.error('Error detectando alucinaciones:', error);
      return { error: error.message };
    }
  };

  /**
   * Generar variaciones de una respuesta
   */
  generateVariations = async (userId, chatbotId, response, count = 3) => {
    try {
      const userOpenAI = await this.openaiClientService.getUserClient(userId);

      const messages = [
        {
          role: 'system',
          content: 'Eres un redactor que crea variaciones de respuestas manteniendo el mismo significado.'
        },
        {
          role: 'user',
          content: `Crea ${count} variaciones diferentes de esta respuesta, manteniendo el mismo mensaje:\n\n"${response}"`
        }
      ];

      const result = await userOpenAI.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages,
        temperature: 0.8,
        max_tokens: 500
      });

      return {
        original: response,
        variations: result.choices[0].message.content.split('\n').filter(v => v.trim()),
        tokensUsed: result.usage.total_tokens
      };

    } catch (error) {
      logger.error('Error generando variaciones:', error);
      return { error: error.message };
    }
  };
}

export default GenerationService;
