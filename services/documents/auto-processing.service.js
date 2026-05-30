/**
 * AutoProcessingService
 * Procesa documentos automáticamente (sin intervención del usuario)
 *
 * Flujo:
 * 1. Usuario sube archivo
 * 2. Sistema procesa TODO en background
 * 3. Usuario ve: "Cargando..." → "✅ Listo"
 * 4. Sin que haga nada más
 */

import logger from '../../utils/logger.js';

class AutoProcessingService {

  /**
   * Procesar documento automáticamente en background
   * El usuario NO espera (async en background)
   */
  processDocumentAsync = async (userId, chatbotId, documentId, file) => {
    try {
      logger.info('⏳ Iniciando procesamiento en background', {
        userId,
        chatbotId,
        documentId,
        fileName: file.originalname
      });

      // Ejecutar el procesamiento en background (sin await)
      this.backgroundProcess(userId, chatbotId, documentId, file)
        .catch(error => {
          logger.error('❌ Error en procesamiento background:', error);
        });

      // Retornar inmediatamente al usuario
      return {
        success: true,
        message: 'Documento subido. Procesando en background...',
        documentId,
        status: 'processing'
      };

    } catch (error) {
      logger.error('Error iniciando procesamiento:', error);
      throw error;
    }
  };

  /**
   * Procesamiento real en background (asincrónico)
   */
  backgroundProcess = async (userId, chatbotId, documentId, file) => {
    try {
      // Importar servicios aquí para evitar circular dependency
      const { getContainer } = await import('../../config/container.js');
      const container = getContainer();

      const ingestionService = new (await import('./ingestion.service.js')).default();
      const analyticsService = container.getAnalyticsService();

      // 1. Procesar documento (parse → chunks → embeddings)
      logger.info('📄 Extrayendo contenido...', { documentId });
      const processingResult = await ingestionService.processDocument(
        userId,
        chatbotId,
        file
      );

      logger.info('✅ Documento procesado', {
        documentId,
        chunks: processingResult.chunks
      });

      // 2. Registrar éxito
      await analyticsService.logEvent({
        type: 'document_processed_auto',
        userId,
        chatbotId,
        documentId,
        chunks: processingResult.chunks,
        status: 'success'
      });

      // 3. Notificar al cliente (vía WebSocket si existe)
      await this.notifyClient(userId, chatbotId, documentId, 'ready');

    } catch (error) {
      logger.error('❌ Error en procesamiento background:', error);

      // Registrar fallo
      const { getContainer } = await import('../../config/container.js');
      const container = getContainer();
      const analyticsService = container.getAnalyticsService();

      await analyticsService.logEvent({
        type: 'document_processed_auto_failed',
        userId,
        chatbotId,
        documentId,
        error: error.message,
        status: 'error'
      });

      // Notificar error al cliente
      await this.notifyClient(userId, chatbotId, documentId, 'error', error.message);
    }
  };

  /**
   * Notificar al cliente del estado (WebSocket)
   */
  notifyClient = async (userId, chatbotId, documentId, status, message = null) => {
    try {
      // Aquí se podría usar WebSocket para notificar en tiempo real
      // Por ahora, solo registramos en logs
      logger.info(`📢 Notificación: ${status}`, {
        userId,
        chatbotId,
        documentId,
        message
      });

      // TODO: Implementar WebSocket real
      // socket.to(userId).emit('document_status', {
      //   documentId,
      //   status,
      //   message
      // });

    } catch (error) {
      logger.warn('Error notificando cliente:', error);
    }
  };

  /**
   * Obtener estado de procesamiento
   */
  getProcessingStatus = async (userId, chatbotId, documentId) => {
    try {
      const { Document } = await import('../../models/index.js');

      const doc = await Document.findOne({
        _id: documentId,
        userId,
        chatbotId
      }).select('status error createdAt');

      if (!doc) {
        return { status: 'not_found' };
      }

      return {
        status: doc.status,
        error: doc.error,
        createdAt: doc.createdAt,
        message: this.getStatusMessage(doc.status)
      };

    } catch (error) {
      logger.error('Error obteniendo estado:', error);
      return { status: 'error', message: 'Error obteniendo estado' };
    }
  };

  /**
   * Mensajes amigables para cada estado
   */
  getStatusMessage = (status) => {
    const messages = {
      uploading: '📤 Subiendo archivo...',
      processing: '⏳ Procesando documento...',
      ready: '✅ Listo para usar',
      error: '❌ Error al procesar',
      draft: '⏳ Pendiente de procesamiento'
    };

    return messages[status] || 'Estado desconocido';
  };

  /**
   * Usar documento automáticamente en respuestas
   * (Se llama desde GenerationService)
   */
  ensureDocumentsReady = async (userId, chatbotId) => {
    try {
      const { Document } = await import('../../models/index.js');

      // Obtener documentos listos
      const readyDocs = await Document.countDocuments({
        userId,
        chatbotId,
        status: 'ready'
      });

      logger.info('📚 Documentos listos:', {
        userId,
        chatbotId,
        count: readyDocs
      });

      return {
        hasDocuments: readyDocs > 0,
        documentCount: readyDocs
      };

    } catch (error) {
      logger.error('Error verificando documentos:', error);
      return { hasDocuments: false, documentCount: 0 };
    }
  };
}

export default AutoProcessingService;
