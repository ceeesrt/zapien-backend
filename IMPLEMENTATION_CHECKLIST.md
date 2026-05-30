# ✅ Checklist de Implementación

## 📦 Archivos Creados

### Core Infrastructure
- [x] `repositories/document.repository.js` - Acceso a datos
- [x] `config/container.js` - Inyección de dependencias
- [x] `controllers/documents.controller.js` - Endpoints de documentos

### RAG System
- [x] `services/rag/retrieval.service.js` - Recuperar documentos
- [x] `services/rag/ranking.service.js` - Re-rankear resultados
- [x] `services/rag/generation.service.js` - Generar respuestas
- [x] `services/openai/prompt-builder.service.js` - Construir prompts

### Monitoring
- [x] `services/monitoring/analytics.service.js` - Registrar eventos

### Documentation
- [x] `ARCHITECTURE.md` - Documentación completa
- [x] `IMPLEMENTATION_SUMMARY.md` - Resumen de implementación
- [x] `INTEGRATION_EXAMPLE.md` - Ejemplos de integración
- [x] `IMPLEMENTATION_CHECKLIST.md` - Este archivo

---

## 🔧 Pasos de Integración

### Fase 1: Conectar Container (CRÍTICO)
- [ ] Actualizar `app.js`:
  ```javascript
  import { initializeContainer } from './config/container.js';
  const container = initializeContainer(openaiClientService);
  ```
- [ ] Verificar que container se inicializa sin errores
- [ ] Verificar que los servicios están accesibles via `container.get*()`

### Fase 2: Migrar Rutas Existentes
- [ ] Revisar rutas actuales en `/routes`
- [ ] Identificar cuáles usan DocumentController
- [ ] Actualizar para usar `container.getDocumentsController()`
- [ ] Identificar cuáles usan MessagesController
- [ ] Actualizar para usar `container.getMessagesController()`

### Fase 3: Verificar Modelos
- [ ] Verificar que `Document` model existe
- [ ] Verificar que tiene campos: userId, chatbotId, chunks, status
- [ ] Verificar que `Chatbot` model existe
- [ ] Verificar que `Message` model existe

### Fase 4: Testing Manual
- [ ] Test: POST /api/documents/:chatbotId/upload
  - [ ] Upload PDF pequeño (< 5MB)
  - [ ] Verificar que se crea documento con status 'ready'
  - [ ] Verificar que chunks se crean correctamente
  - [ ] Verificar respuesta exitosa

- [ ] Test: GET /api/documents/:chatbotId
  - [ ] Verificar que retorna lista de documentos
  - [ ] Verificar estadísticas (totalChunks, totalTokens)

- [ ] Test: GET /api/documents/:chatbotId/stats
  - [ ] Verificar que retorna estadísticas correctas

- [ ] Test: DELETE /api/documents/:documentId
  - [ ] Verificar que documento se elimina
  - [ ] Verificar que archivo se elimina del storage

### Fase 5: Verificar RAG
- [ ] Test: POST /api/messages/:chatbotId
  - [ ] Enviar mensaje con documentos cargados
  - [ ] Verificar que RetrievalService encuentra contexto
  - [ ] Verificar que GenerationService produce respuesta
  - [ ] Verificar que incluye sources

- [ ] Test: Validación de alucinaciones
  - [ ] Enviar mensaje que NO está en documentos
  - [ ] Verificar que respuesta tiene confidence 'low'
  - [ ] Verificar que no inventa información

### Fase 6: Performance & Monitoring
- [ ] Test: GET /api/health
  - [ ] Verificar status 'healthy'
  - [ ] Verificar servicios listados

- [ ] Test: GET /api/stats/:chatbotId
  - [ ] Verificar estadísticas de documentos
  - [ ] Verificar estadísticas de búsqueda

- [ ] Verificar logs en console
  - [ ] Documentos procesados
  - [ ] Contextos recuperados
  - [ ] Respuestas generadas

---

## 🛠️ Dependencias Requeridas

Verifica que estos servicios ya existen:

- [x] `EmbeddingService` - Crear embeddings (debería estar en services/embeddings/)
- [x] `ParserService` - Extraer texto (debería estar en services/documents/)
- [x] `StorageService` - Guardar archivos (debería estar en services/documents/)
- [x] `OpenAIClientService` - Cliente de OpenAI (debería estar en services/openai/)
- [x] `AnalyticsService` - Registrar eventos (creado en services/monitoring/)

Si alguno no existe, ejecuta este comando para encontrarlo:

```bash
# Buscar servicio
find . -name "*embedding*" -o -name "*parser*" -o -name "*storage*"
```

---

## 📋 Verificación de Modelos

### Document Model
Debe tener estos campos:
```javascript
{
  _id: ObjectId,
  userId: ObjectId,        // ✅ REQUERIDO
  chatbotId: ObjectId,     // ✅ REQUERIDO
  originalFile: {
    name: String,          // ✅ REQUERIDO
    type: String,
    size: Number,
    s3Url: String,
    uploadedAt: Date
  },
  chunks: [{
    id: String,
    text: String,          // ✅ REQUERIDO
    tokens: Number,
    embedding: [Number],   // ✅ REQUERIDO (512 dims)
    metadata: {
      category: String,
      importance: String,
      language: String
    }
  }],
  status: String,          // ✅ REQUERIDO (uploading/processing/ready/error)
  stats: {
    totalChunks: Number,
    totalTokens: Number,
    totalEmbeddingCost: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

Verificar con:
```bash
grep -n "chunks:" models/Document.js
grep -n "embedding:" models/Document.js
```

---

## 🧪 Tests Manuales Quick

### Test 1: Upload
```bash
curl -X POST http://localhost:5001/api/documents/chatbot-id/upload \
  -H "Authorization: Bearer token" \
  -F "file=@sample.pdf"
```

Expected:
```json
{
  "success": true,
  "data": {
    "documentId": "...",
    "chunks": 25,
    "status": "ready"
  }
}
```

### Test 2: Query
```bash
curl -X POST http://localhost:5001/api/messages/chatbot-id \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "¿Cuánto cuesta?",
    "conversationId": "conv-123"
  }'
```

Expected:
```json
{
  "success": true,
  "data": {
    "text": "Basándome en...",
    "sources": ["documento.pdf"],
    "confidence": "high",
    "contextsUsed": 3
  }
}
```

---

## 🔍 Debugging

Si algo no funciona:

### 1. Verificar Container Initialization
```bash
# En app.js, agrega logs
console.log('🔌 Inicializando container...');
const container = initializeContainer(openaiClientService);
console.log('✅ Container listo');
console.log('📊 Servicios:', {
  retrieval: !!container.getRetrievalService(),
  generation: !!container.getGenerationService(),
  analytics: !!container.getAnalyticsService()
});
```

### 2. Verificar Embeddings
```bash
# Revisar logs de EmbeddingService
grep -i "embedding" logs/debug.log | tail -20
```

### 3. Verificar MongoDB
```bash
# Conectar a MongoDB y revisar
db.documents.findOne({})
# Debe tener field "chunks" con "embedding" array
```

### 4. Verificar OpenAI
```bash
# Revisar errores de API
grep -i "openai" logs/error.log | tail -10
```

---

## 📊 Checklist de Producción

- [ ] Environment variables configuradas (.env)
- [ ] Database backups configurados
- [ ] Error handling en todos los endpoints
- [ ] Rate limiting activado
- [ ] Logs estructurados enviados a sistema de logging
- [ ] Monitoring/alerts configurado
- [ ] Security headers configurados
- [ ] CORS configurado correctamente
- [ ] API keys de OpenAI rotadas
- [ ] Tests unitarios creados
- [ ] Tests de integración creados
- [ ] Documentación actualizada
- [ ] CI/CD pipeline funcionando

---

## 🚀 Comandos Útiles

```bash
# Ver todos los servicios creados
ls -la services/*/

# Verificar que archivos tienen el container
grep -r "container\." --include="*.js" | wc -l

# Ver logs en tiempo real
tail -f logs/*.log

# Ejecutar tests
npm test

# Build para producción
npm run build

# Start
npm start
```

---

## 📞 Soporte

Si algo no funciona:

1. **Revisar ARCHITECTURE.md** - Documentación completa
2. **Revisar INTEGRATION_EXAMPLE.md** - Ejemplos prácticos
3. **Verificar logs** - Buscar errores específicos
4. **Verificar modelos** - ¿Tienen los campos requeridos?
5. **Verificar container** - ¿Se inicializa correctamente?

---

**Estado**: ✅ LISTA PARA IMPLEMENTACIÓN  
**Fecha**: 28 de Mayo 2026  
**Versión**: 1.0

**Próximo paso**: Conectar container a app.js
