import DocumentRepository from '../repositories/document.repository.js';
import IngestionService from '../services/documents/ingestion.service.js';
import ParserService from '../services/documents/parser.service.js';
import StorageService from '../services/documents/storage.service.js';
import EmbeddingService from '../services/embeddings/embedding.service.js';
import RetrievalService from '../services/rag/retrieval.service.js';
import GenerationService from '../services/rag/generation.service.js';
import AnalyticsService from '../services/monitoring/analytics.service.js';
import PromptBuilderService from '../services/openai/prompt-builder.service.js';
import DocumentsController from '../controllers/documents.controller.js';
import MessagesController from '../controllers/embed.controller.js';

class Container {
  constructor() {
    // Repositories
    this.documentRepository = new DocumentRepository();

    // Services - Documentos
    this.parserService = new ParserService();
    this.storageService = new StorageService();

    // Services - Embeddings
    this.embeddingService = null;

    // Services - RAG
    this.retrievalService = null;
    this.generationService = null;

    // Services - Utilidades
    this.analyticsService = new AnalyticsService();
    this.promptBuilderService = new PromptBuilderService();

    // Controllers
    this.documentsController = null;
    this.messagesController = null;
  }

  initialize(openaiClientService) {
    console.log('🚀 Inicializando Container...');

    // Inicializar EmbeddingService
    this.embeddingService = new EmbeddingService(openaiClientService);
    console.log('✅ EmbeddingService inicializado');

    // Inicializar RetrievalService
    this.retrievalService = new RetrievalService(
      this.documentRepository,
      this.embeddingService
    );
    console.log('✅ RetrievalService inicializado');

    // Inicializar GenerationService
    this.generationService = new GenerationService(
      openaiClientService,
      this.retrievalService,
      this.promptBuilderService,
      this.analyticsService
    );
    console.log('✅ GenerationService inicializado');

    // Inicializar IngestionService
    const ingestionService = new IngestionService(
      this.parserService,
      this.storageService,
      this.embeddingService,
      this.documentRepository,
      this.analyticsService
    );
    console.log('✅ IngestionService inicializado');

    // Inicializar Controllers
    this.documentsController = new DocumentsController(
      ingestionService,
      this.analyticsService,
      this.documentRepository
    );
    console.log('✅ DocumentsController inicializado');

    this.messagesController = new MessagesController(
      this.generationService,
      this.analyticsService
    );
    console.log('✅ MessagesController inicializado');

    console.log('🎉 Container inicializado completamente');
  }

  // Getters para acceso a servicios
  getDocumentsController() {
    return this.documentsController;
  }

  getMessagesController() {
    return this.messagesController;
  }

  getRetrievalService() {
    return this.retrievalService;
  }

  getGenerationService() {
    return this.generationService;
  }

  getAnalyticsService() {
    return this.analyticsService;
  }
}

// Singleton
let instance = null;

export const getContainer = () => {
  if (!instance) {
    instance = new Container();
  }
  return instance;
};

export const initializeContainer = (openaiClientService) => {
  const container = getContainer();
  container.initialize(openaiClientService);
  return container;
};

export default Container;
