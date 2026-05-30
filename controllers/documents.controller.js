/**
 * DocumentsController
 * Maneja los endpoints relacionados con documentos
 *
 * Dependencias inyectadas:
 * - ingestionService: Procesa documentos
 * - analyticsService: Registra eventos
 * - documentRepository: Acceso a datos
 */

class DocumentsController {
  constructor(ingestionService, analyticsService, documentRepository) {
    this.ingestionService = ingestionService;
    this.analyticsService = analyticsService;
    this.documentRepository = documentRepository;
  }

  /**
   * POST /api/documents/:chatbotId/upload
   * Subir y procesar un documento
   */
  uploadDocument = async (req, res, next) => {
    try {
      const { chatbotId } = req.params;
      const userId = req.user._id;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se proporcionó ningún archivo'
        });
      }

      // Procesar documento
      const result = await this.ingestionService.processDocument(
        userId,
        chatbotId,
        req.file
      );

      // Registrar evento
      await this.analyticsService.logEvent({
        type: 'document_uploaded',
        userId,
        chatbotId,
        documentId: result.documentId,
        size: req.file.size,
        chunks: result.chunks
      });

      res.json({
        success: true,
        message: 'Documento procesado exitosamente',
        data: result
      });

    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/documents/:chatbotId
   * Listar documentos de un chatbot
   */
  listDocuments = async (req, res, next) => {
    try {
      const { chatbotId } = req.params;
      const userId = req.user._id;

      const documents = await this.documentRepository.findByUserAndChatbot(
        userId,
        chatbotId
      );

      // Obtener estadísticas
      const stats = await this.documentRepository.getDocumentStats(
        userId,
        chatbotId
      );

      res.json({
        success: true,
        data: {
          documents,
          stats: {
            totalDocuments: stats.totalDocuments,
            totalChunks: stats.totalChunks,
            totalTokens: stats.totalTokens,
            totalSize: stats.totalSize
          }
        }
      });

    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/documents/:documentId
   * Eliminar un documento
   */
  deleteDocument = async (req, res, next) => {
    try {
      const { documentId } = req.params;
      const userId = req.user._id;

      const document = await this.documentRepository.findOne({
        _id: documentId,
        userId
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Documento no encontrado'
        });
      }

      // Eliminar archivo del storage
      if (document.filePath) {
        await this.storageService.delete(document.filePath);
      }

      // Eliminar de la base de datos
      await this.documentRepository.delete(documentId);

      // Registrar evento
      await this.analyticsService.logEvent({
        type: 'document_deleted',
        userId,
        chatbotId: document.chatbotId,
        documentId
      });

      res.json({
        success: true,
        message: 'Documento eliminado exitosamente'
      });

    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/documents/:chatbotId/stats
   * Obtener estadísticas de documentos
   */
  getDocumentStats = async (req, res, next) => {
    try {
      const { chatbotId } = req.params;
      const userId = req.user._id;

      const stats = await this.documentRepository.getDocumentStats(
        userId,
        chatbotId
      );

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/documents/:chatbotId/:category
   * Obtener chunks por categoría
   */
  getChunksByCategory = async (req, res, next) => {
    try {
      const { chatbotId, category } = req.params;
      const userId = req.user._id;

      const chunks = await this.documentRepository.getChunksByCategory(
        userId,
        chatbotId,
        category
      );

      res.json({
        success: true,
        data: {
          category,
          chunks: chunks.length,
          items: chunks
        }
      });

    } catch (error) {
      next(error);
    }
  };
}

export default DocumentsController;
