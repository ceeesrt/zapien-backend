# Arquitectura Modular de Zapien Backend

## 📋 Descripción General

Zapien Backend utiliza una arquitectura modular, escalable y mantenible basada en:

- **Inyección de Dependencias**: Desacoplamiento de servicios
- **Patrón Repository**: Acceso a datos centralizado
- **Servicios Reutilizables**: Lógica de negocio modular
- **Controladores Limpios**: Endpoints sin lógica de negocio

---

## 🏗️ Estructura de Carpetas

```
zapien-backend/
├── config/
│   └── container.js              # 🎯 Inyección de dependencias (Singleton)
│
├── repositories/
│   └── document.repository.js     # 📊 Acceso a datos (Database layer)
│
├── controllers/
│   ├── documents.controller.js    # 📤 Endpoints de documentos
│   └── embed.controller.js        # 💬 Endpoints de mensajes
│
├── services/
│   ├── documents/
│   │   ├── ingestion.service.js   # ⬆️  Upload + Procesamiento
│   │   ├── parser.service.js      # 📄 Extracción de texto
│   │   └── storage.service.js     # 💾 Almacenamiento de archivos
│   │
│   ├── rag/
│   │   ├── retrieval.service.js   # 🔍 Buscar documentos
│   │   ├── ranking.service.js     # 📊 Re-rankear resultados
│   │   ├── generation.service.js  # 🤖 OpenAI + Respuestas
│   │   └── advanced-rag.service.js # ⚡ RAG avanzado (legacy)
│   │
│   ├── embeddings/
│   │   └── embedding.service.js   # 🧠 Crear embeddings
│   │
│   ├── openai/
│   │   ├── openai-client.service.js # 🔑 Gestionar API keys
│   │   └── prompt-builder.service.js # 📝 Construir prompts
│   │
│   └── monitoring/
│       └── analytics.service.js   # 📈 Registrar eventos
│
├── models/
│   ├── Document.js
│   ├── Chatbot.js
│   ├── Message.js
│   └── ...
│
├── routes/
│   └── index.js                   # 🛣️  Enrutador principal
│
├── middlewares/
│   ├── auth.middleware.js
│   └── error-handler.middleware.js
│
├── utils/
│   └── logger.js
│
├── app.js                         # 🚀 Aplicación principal
└── ARCHITECTURE.md               # 📖 Este archivo
```

---

## 🔄 Flujo de Datos

### 1. Upload de Documento

```
Cliente
  ↓
DocumentsController.uploadDocument()
  ↓
IngestionService.processDocument()
  ├─ ParserService.parse() → Extraer texto
  ├─ StorageService.save() → Guardar archivo
  ├─ EmbeddingService.process() → Crear embeddings
  └─ DocumentRepository.update() → Guardar en BD
  ↓
Respuesta al cliente
```

### 2. Mensaje/Pregunta del Usuario

```
Cliente → "¿Cuánto cuesta?"
  ↓
MessagesController.sendMessage()
  ↓
GenerationService.generateResponse()
  ├─ RetrievalService.retrieveContext()
  │   ├─ semanticSearch() → Embeddings
  │   ├─ keywordSearch() → Palabras clave
  │   └─ RankingService.rankAndFilter() → Fusionar
  │
  ├─ PromptBuilderService.buildMessages()
  │
  ├─ OpenAI.chat.completions.create()
  │
  ├─ validateResponse() → Validar alucinaciones
  │
  └─ AnalyticsService.logEvent()
  ↓
Respuesta al cliente
```

---

## 🧩 Componentes Principales

### DocumentRepository

**Responsabilidad**: Acceso a datos de documentos

```javascript
// Métodos clave
create(data)                                    // Crear documento
find(filter)                                    // Listar documentos
findById(id)                                    // Obtener por ID
update(id, data)                                // Actualizar
delete(id)                                      // Eliminar
searchByEmbedding(userId, chatbotId, embedding) // Búsqueda semántica
```

### IngestionService

**Responsabilidad**: Procesar documentos subidos

Dependencias:
- `ParserService` - Extraer contenido
- `StorageService` - Guardar archivos
- `EmbeddingService` - Crear embeddings
- `DocumentRepository` - Persistir en BD
- `AnalyticsService` - Registrar eventos

### RetrievalService

**Responsabilidad**: Recuperar documentos relevantes

Dependencias:
- `DocumentRepository` - Acceso a datos
- `EmbeddingService` - Crear embeddings
- `RankingService` - Re-rankear resultados

Métodos:
```javascript
retrieveContext(userId, chatbotId, query)     // Contexto para generación
semanticSearch(userId, chatbotId, query)      // Búsqueda por embeddings
keywordSearch(userId, chatbotId, query)       // Búsqueda por palabras clave
advancedSearch(userId, chatbotId, query)      // Búsqueda avanzada
```

### GenerationService

**Responsabilidad**: Generar respuestas usando OpenAI

Dependencias:
- `OpenAIClientService` - Cliente de OpenAI
- `RetrievalService` - Recuperar contexto
- `PromptBuilderService` - Construir prompts
- `AnalyticsService` - Registrar eventos

Métodos:
```javascript
generateResponse(userId, chatbotId, query)    // Generar respuesta
validateResponse(openaiClient, response)      // Validar alucinaciones
classifyQuery(userId, query)                  // Clasificar pregunta
detectHallucinations(userId, response)        // Detectar mentiras
```

### RankingService

**Responsabilidad**: Re-rankear y fusionar resultados de búsqueda

Métodos:
```javascript
mergeAndRerank(semantic, keyword, query)      // Fusionar y rankear
detectRelevantCategories(query)                // Detectar categorías
filterByScore(results, minScore)               // Filtrar por score
diversify(results, maxPerSource)               // Diversificar resultados
```

### PromptBuilderService

**Responsabilidad**: Construir prompts profesionales para OpenAI

Métodos:
```javascript
buildSystemPrompt(chatbot, context)            // System prompt
buildUserMessage(query, context)               // User message
buildMessages(chatbot, query, context)         // Ambos mensajes
buildValidationPrompt(response, context)       // Validación
buildClassificationPrompt(query)               // Clasificación
```

### AnalyticsService

**Responsabilidad**: Registrar eventos y métricas

Métodos:
```javascript
logEvent(event)                                // Registrar evento
logBatch(events)                               // Lote de eventos
logPerformance(operation, duration)            // Métrica de rendimiento
logError(error, context)                       // Registrar error
getHealthCheck()                               // Estado del sistema
```

---

## 🔌 Inyección de Dependencias

### Container.js (Singleton)

Punto central que instancia y wirea todas las dependencias:

```javascript
// Inicialización única
const container = getContainer();
container.initialize(openaiClientService);

// Acceso a servicios
const controller = container.getDocumentsController();
const retrieval = container.getRetrievalService();
```

### En app.js

```javascript
import { initializeContainer } from './config/container.js';
import OpenAIClientService from './services/openai/openai-client.service.js';

const openaiClientService = new OpenAIClientService();
const container = initializeContainer(openaiClientService);

// Usar controladores
app.use('/documents', documentsRoutes(container.getDocumentsController()));
app.use('/messages', messagesRoutes(container.getMessagesController()));
```

---

## 📊 Flujo RAG (Retrieval-Augmented Generation)

### Fase 1: Almacenamiento

```
Documento Subido
  ↓ ParserService
Contenido Extraído
  ↓ split en chunks
Chunks de 500 tokens
  ↓ EmbeddingService
Embeddings de 512 dimensiones
  ↓ DocumentRepository
MongoDB (almacenado con metadatos)
```

### Fase 2: Búsqueda

```
Query: "¿Cuánto cuesta?"
  ↓
RetrievalService.retrieveContext()
  ├─ EmbeddingService.createEmbedding(query)
  ├─ DocumentRepository.searchByEmbedding() → Resultados semánticos
  └─ keywordSearch() → Resultados por palabras clave
  ↓
RankingService.rankAndFilter()
  ├─ Fusionar resultados
  ├─ Calcular scores finales
  ├─ Filtrar por score mínimo (0.6)
  ├─ Diversificar (máx 2 por fuente)
  └─ Top 5 resultados
```

### Fase 3: Generación

```
Top 5 documentos
  ↓
PromptBuilderService.buildMessages()
  ├─ buildSystemPrompt() - Instrucciones de sistema
  └─ buildUserMessage() - Query + contexto
  ↓
OpenAI API
  ├─ model: "gpt-3.5-turbo" o "gpt-4"
  ├─ temperature: 0.7
  ├─ max_tokens: 500
  └─ Generar respuesta
  ↓
GenerationService.validateResponse()
  └─ Verificar que está basada en documentos
  ↓
Respuesta al cliente
```

---

## ✅ Testing por Componente

### Test del Repository

```javascript
describe('DocumentRepository', () => {
  it('should find documents by user and chatbot', async () => {
    const docs = await repo.findByUserAndChatbot(userId, chatbotId);
    expect(docs.length).toBeGreaterThan(0);
  });
});
```

### Test del RetrievalService

```javascript
describe('RetrievalService', () => {
  it('should retrieve context for a query', async () => {
    const context = await retrieval.retrieveContext(userId, chatbotId, query);
    expect(context.results.length).toBeGreaterThan(0);
  });
});
```

### Test del GenerationService

```javascript
describe('GenerationService', () => {
  it('should generate valid response', async () => {
    const result = await generation.generateResponse(userId, chatbotId, query);
    expect(result.confidence).toBe('high');
  });
});
```

---

## 🚀 Escalabilidad

### Horizontal

```
Load Balancer
  ├─ Instance 1 (Container A)
  ├─ Instance 2 (Container B)
  └─ Instance 3 (Container C)
  ↓
MongoDB Atlas (shared)
AWS S3 / Storage (shared)
OpenAI API (shared)
```

### Vertical

- Cache en memoria (`RankingService`)
- Índices en MongoDB (`searchByEmbedding`)
- Compresión de embeddings (512 dims en lugar de 1536)
- Batch processing de embeddings

---

## 📈 Agregación de Funcionalidades

### Agregar nuevo tipo de búsqueda

```javascript
// 1. En RetrievalService
customSearch = async (userId, chatbotId, filters) => {
  // Implementar lógica
};

// 2. En PromptBuilderService
// Construir prompt específico

// 3. En GenerationService
// Usar la búsqueda custom
```

### Agregar validación mejorada

```javascript
// 1. Crear ValidatorService
class ValidatorService {
  validateWithLLM = async (response, context) => { ... };
}

// 2. Inyectarlo en GenerationService
constructor(..., validatorService) {
  this.validatorService = validatorService;
}

// 3. Usar en generateResponse()
```

### Agregar cache

```javascript
// 1. Crear CacheService
class CacheService {
  get(key) { ... }
  set(key, value, ttl) { ... }
}

// 2. Inyectar en RetrievalService
// 3. Cache de queries frecuentes
```

---

## 🔐 Seguridad

- API keys encriptadas en BD
- Validación por usuario (documentos aislados)
- Validación de respuestas (evitar alucinaciones)
- Logging de todas las operaciones
- Rate limiting (implementado en middleware)

---

## 📝 Logging Estructurado

Todos los servicios usan `logger`:

```javascript
logger.info('🔍 Recuperando contexto', { userId, chatbotId, query });
logger.debug('Resultados semánticos:', results.length);
logger.warn('⚠️ Respuesta no validada', { query });
logger.error('❌ Error generando respuesta:', error);
```

---

## 🎯 Próximos Pasos

1. ✅ **Estructura modular completada**
2. ⏳ **Conectar container a app.js**
3. ⏳ **Migrar controladores existentes**
4. ⏳ **Agregar tests unitarios**
5. ⏳ **Implementar cache layer**
6. ⏳ **Agregar monitoring en producción**

---

**Última actualización**: 28 de Mayo 2026
**Versión**: 1.0
