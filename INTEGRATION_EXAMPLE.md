# 📚 Guía de Integración - Ejemplo Práctico

## Cómo Integrar el Container en tu app.js

### Paso 1: Inicializar en app.js

```javascript
// app.js
import express from 'express';
import { initializeContainer } from './config/container.js';
import OpenAIClientService from './services/openai/openai-client.service.js';
import logger from './utils/logger.js';

const app = express();

// Middlewares globales
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =====================================================
// 🔌 INICIALIZAR CONTAINER (UNA SOLA VEZ)
// =====================================================
const openaiClientService = new OpenAIClientService();
const container = initializeContainer(openaiClientService);

console.log('✅ Container inicializado');

// =====================================================
// 🛣️  RUTAS
// =====================================================

// DOCUMENTOS
app.post('/api/documents/:chatbotId/upload', 
  authMiddleware,
  multerMiddleware,
  async (req, res, next) => {
    try {
      const controller = container.getDocumentsController();
      await controller.uploadDocument(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

app.get('/api/documents/:chatbotId',
  authMiddleware,
  async (req, res, next) => {
    try {
      const controller = container.getDocumentsController();
      await controller.listDocuments(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

app.delete('/api/documents/:documentId',
  authMiddleware,
  async (req, res, next) => {
    try {
      const controller = container.getDocumentsController();
      await controller.deleteDocument(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

app.get('/api/documents/:chatbotId/stats',
  authMiddleware,
  async (req, res, next) => {
    try {
      const controller = container.getDocumentsController();
      await controller.getDocumentStats(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// MENSAJES
app.post('/api/messages/:chatbotId',
  authMiddleware,
  async (req, res, next) => {
    try {
      const controller = container.getMessagesController();
      await controller.sendMessage(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// =====================================================
// ERROR HANDLER
// =====================================================
app.use((err, req, res, next) => {
  logger.error('Error no capturado:', err);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// =====================================================
// START SERVER
// =====================================================
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
});

export default app;
```

---

## Usar Servicios Directamente

### Desde otro servicio o controlador

```javascript
// Obtener servicios del container
const container = getContainer();

const retrievalService = container.getRetrievalService();
const generationService = container.getGenerationService();
const analyticsService = container.getAnalyticsService();

// Usar RetrievalService
const context = await retrievalService.retrieveContext(userId, chatbotId, query);
console.log('Documentos encontrados:', context.results.length);

// Usar GenerationService
const response = await generationService.generateResponse(userId, chatbotId, query);
console.log('Respuesta:', response.text);
console.log('Confianza:', response.confidence);

// Usar AnalyticsService
await analyticsService.logEvent({
  type: 'custom_event',
  userId,
  chatbotId,
  data: { custom: 'data' }
});
```

---

## Ejemplo: Endpoint Personalizado

### Crear endpoint que use múltiples servicios

```javascript
// POST /api/custom/advanced-search
app.post('/api/custom/advanced-search',
  authMiddleware,
  async (req, res, next) => {
    try {
      const { chatbotId, query, category, importance } = req.body;
      const userId = req.user._id;

      // Obtener servicios
      const container = getContainer();
      const retrieval = container.getRetrievalService();
      const analytics = container.getAnalyticsService();

      // Búsqueda avanzada
      const context = await retrieval.advancedSearch(
        userId,
        chatbotId,
        query,
        {
          category,
          importance,
          limit: 5
        }
      );

      // Registrar evento
      await analytics.logEvent({
        type: 'advanced_search',
        userId,
        chatbotId,
        resultsFound: context.results.length,
        filters: { category, importance }
      });

      res.json({
        success: true,
        data: {
          query,
          results: context.results,
          totalFound: context.totalFound,
          message: context.message
        }
      });

    } catch (error) {
      next(error);
    }
  }
);
```

---

## Ejemplo: Validación y Procesamiento

### Endpoint con validación completa

```javascript
// POST /api/messages/:chatbotId/with-validation
app.post('/api/messages/:chatbotId/with-validation',
  authMiddleware,
  async (req, res, next) => {
    try {
      const { chatbotId } = req.params;
      const { message, conversationId } = req.body;
      const userId = req.user._id;

      // Validaciones básicas
      if (!message || message.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'El mensaje no puede estar vacío'
        });
      }

      // Obtener servicios
      const container = getContainer();
      const generation = container.getGenerationService();
      const analytics = container.getAnalyticsService();

      // Generar respuesta CON validación
      const startTime = Date.now();
      const response = await generation.generateResponse(userId, chatbotId, message, {
        conversationId,
        validateResponse: true,
        model: 'gpt-3.5-turbo'
      });
      const duration = Date.now() - startTime;

      // Registrar métricas de performance
      await analytics.logPerformance('generate_response', duration, response.confidence === 'high', {
        chatbotId,
        messageLength: message.length,
        contextsUsed: response.contextsUsed,
        tokens: response.usage.totalTokens
      });

      // Si hay baja confianza, registrar para review
      if (response.confidence === 'low') {
        await analytics.logEvent({
          type: 'low_confidence_response',
          userId,
          chatbotId,
          conversationId,
          message: message.substring(0, 100),
          response: response.text.substring(0, 100)
        });
      }

      res.json({
        success: true,
        data: response
      });

    } catch (error) {
      next(error);
    }
  }
);
```

---

## Ejemplo: Monitoreo y Salud del Sistema

### Endpoint de health check

```javascript
// GET /api/health
app.get('/api/health',
  async (req, res) => {
    try {
      const container = getContainer();
      const analytics = container.getAnalyticsService();

      const health = await analytics.getHealthCheck();

      res.status(health.status === 'healthy' ? 200 : 503).json(health);

    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        error: error.message
      });
    }
  }
);

// GET /api/stats/:chatbotId
app.get('/api/stats/:chatbotId',
  authMiddleware,
  async (req, res, next) => {
    try {
      const { chatbotId } = req.params;
      const userId = req.user._id;

      const container = getContainer();
      const retrieval = container.getRetrievalService();
      const analytics = container.getAnalyticsService();

      // Obtener estadísticas de búsqueda
      const searchStats = await retrieval.getSearchStats(userId, chatbotId);

      // Obtener estadísticas generales
      const generalStats = await analytics.getStats(userId, chatbotId);

      res.json({
        success: true,
        data: {
          search: searchStats,
          general: generalStats
        }
      });

    } catch (error) {
      next(error);
    }
  }
);
```

---

## Estructura Completa de app.js

```javascript
// ========================================
// IMPORTS
// ========================================
import express from 'express';
import { initializeContainer } from './config/container.js';
import OpenAIClientService from './services/openai/openai-client.service.js';
import { authMiddleware, errorHandler } from './middlewares/index.js';

// ========================================
// APP INIT
// ========================================
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========================================
// CONTAINER INIT
// ========================================
const openaiClientService = new OpenAIClientService();
const container = initializeContainer(openaiClientService);

// ========================================
// ROUTES
// ========================================

// Documents
app.post('/api/documents/:chatbotId/upload', authMiddleware, async (req, res, next) => {
  const controller = container.getDocumentsController();
  await controller.uploadDocument(req, res, next);
});

app.get('/api/documents/:chatbotId', authMiddleware, async (req, res, next) => {
  const controller = container.getDocumentsController();
  await controller.listDocuments(req, res, next);
});

app.delete('/api/documents/:documentId', authMiddleware, async (req, res, next) => {
  const controller = container.getDocumentsController();
  await controller.deleteDocument(req, res, next);
});

// Messages
app.post('/api/messages/:chatbotId', authMiddleware, async (req, res, next) => {
  const controller = container.getMessagesController();
  await controller.sendMessage(req, res, next);
});

// Health
app.get('/api/health', async (req, res) => {
  const analytics = container.getAnalyticsService();
  const health = await analytics.getHealthCheck();
  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});

// Stats
app.get('/api/stats/:chatbotId', authMiddleware, async (req, res, next) => {
  const retrieval = container.getRetrievalService();
  const stats = await retrieval.getSearchStats(req.user._id, req.params.chatbotId);
  res.json({ success: true, data: stats });
});

// ========================================
// ERROR HANDLER
// ========================================
app.use(errorHandler);

// ========================================
// START
// ========================================
app.listen(process.env.PORT || 5001, () => {
  console.log('🚀 Server running');
});

export default app;
```

---

## Testing con el Container

```javascript
// tests/integration/rag.test.js
import { getContainer, initializeContainer } from '../config/container.js';
import OpenAIClientService from '../services/openai/openai-client.service.js';

describe('RAG Integration', () => {
  let container;

  beforeAll(() => {
    const openaiService = new OpenAIClientService();
    container = initializeContainer(openaiService);
  });

  test('should retrieve context', async () => {
    const retrieval = container.getRetrievalService();
    const context = await retrieval.retrieveContext(userId, chatbotId, 'query');
    expect(context.results.length).toBeGreaterThan(0);
  });

  test('should generate response', async () => {
    const generation = container.getGenerationService();
    const response = await generation.generateResponse(userId, chatbotId, 'query');
    expect(response.text).toBeDefined();
    expect(response.confidence).toBeDefined();
  });
});
```

---

**¡Listo para usar!** 🎉

Ahora tu app.js está modular, escalable y fácil de mantener.
