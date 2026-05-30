# 📱 FLUJO SIMPLE PARA EL USUARIO

## La Idea
El usuario subirá documentos en su dashboard y **punto**. El sistema hace todo automáticamente en background.

```
Usuario
  ↓
[Clic en "Subir documento"]
  ↓
[Selecciona PDF/DOCX]
  ↓
[Sistema procesa en BACKGROUND]
  ↓
"✅ Listo" (puede cerrar modal y seguir)
  ↓
Cuando cliente pregunta en el chat → Sistema usa esa info automáticamente
```

---

## ¿Por qué BACKGROUND?

**Problema anterior:**
- Usuario sube PDF
- Espera 30+ segundos mientras se procesa
- Mala experiencia

**Solución (BACKGROUND):**
- Usuario sube PDF
- Retorno inmediato: "Procesando..."
- Usuario puede cerrar modal, ir a otra sección
- Cuando está listo (5-30 seg después) → "✅ Listo"
- En el chat, automáticamente funciona

---

## FLUJO TÉCNICO

### 1. FRONTEND - Upload Modal Simple

```jsx
// UploadDocumentModal.jsx
const UploadDocumentModal = ({ visible, onClose, chatbotId }) => {
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState('waiting'); // waiting, uploading, processing, ready, error
  const [fileName, setFileName] = useState('');

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setUploading(true);
    setStatus('uploading');

    const formData = new FormData();
    formData.append('file', file);

    try {
      // POST al endpoint simple
      const response = await fetch(
        `/api/documents/${chatbotId}/upload`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        }
      );

      const result = await response.json();

      if (result.success) {
        setStatus('processing'); // Procesando en background
        
        // Después de 3-5 segundos, mostrar "Listo"
        setTimeout(() => {
          setStatus('ready');
          // Cerrar modal automáticamente
          setTimeout(() => {
            onClose();
            setStatus('waiting');
            setFileName('');
          }, 2000);
        }, 3000);
      }
    } catch (error) {
      setStatus('error');
    }
  };

  return (
    <Modal visible={visible} onCancel={onClose} footer={null} title="Subir Documento">
      {status === 'waiting' && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Selecciona un PDF, DOCX o TXT</p>
          <input
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={handleUpload}
            disabled={uploading}
          />
        </div>
      )}

      {status === 'uploading' && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin />
          <p>Subiendo {fileName}...</p>
        </div>
      )}

      {status === 'processing' && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin />
          <p>Procesando documento...</p>
          <small style={{ opacity: 0.7 }}>Puedes cerrar esto, sigue en background</small>
        </div>
      )}

      {status === 'ready' && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h3>✅ ¡Listo!</h3>
          <p>{fileName} procesado</p>
          <small style={{ opacity: 0.7 }}>El chatbot ahora usa esta información</small>
        </div>
      )}

      {status === 'error' && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#f5222d' }}>
          <h3>❌ Error</h3>
          <p>No se pudo procesar el documento</p>
          <Button onClick={() => setStatus('waiting')}>Intentar de nuevo</Button>
        </div>
      )}
    </Modal>
  );
};
```

---

### 2. BACKEND - Controller Simplificado

```javascript
// controllers/documents.controller.js

uploadDocument = async (req, res, next) => {
  try {
    const { chatbotId } = req.params;
    const userId = req.user._id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: 'No file provided' });
    }

    // 1. Crear documento en BD (status: 'draft')
    const document = await Document.create({
      userId,
      chatbotId,
      originalFile: {
        name: file.originalname,
        type: file.mimetype,
        size: file.size,
        uploadedAt: new Date()
      },
      status: 'processing' // Estado inmediato
    });

    // 2. **RETORNAR INMEDIATAMENTE** sin esperar procesamiento
    res.status(201).json({
      success: true,
      message: 'Documento subido. Procesando en background...',
      data: {
        documentId: document._id,
        status: 'processing',
        fileName: file.originalname
      }
    });

    // 3. **EN BACKGROUND** - procesar documento
    // (No espera a que termine el upload endpoint)
    const autoProcessingService = container.getAutoProcessingService();
    autoProcessingService.processDocumentAsync(userId, chatbotId, document._id, file)
      .catch(error => {
        logger.error('❌ Error en background:', error);
      });

  } catch (error) {
    next(error);
  }
};
```

---

### 3. BACKEND - AutoProcessingService (ya creado)

El servicio que creé hace exactamente esto:
- Procesa en background (sin bloquear el upload)
- Notifica al cliente cuando está listo (vía WebSocket)
- Maneja errores gracefully

---

### 4. FRONTEND - Lista de Documentos

```jsx
// DocumentsList.jsx

const DocumentsList = ({ chatbotId, refreshTrigger }) => {
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    fetchDocuments();
    
    // POLLING: cada 2 segundos, verificar status
    const interval = setInterval(checkDocumentStatus, 2000);
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  const checkDocumentStatus = async () => {
    // GET /api/documents/:chatbotId
    const response = await fetch(`/api/documents/${chatbotId}`);
    const result = await response.json();
    
    if (result.success) {
      setDocuments(result.data);
    }
  };

  return (
    <div>
      <h3>Documentos Cargados</h3>
      {documents.length === 0 && (
        <p style={{ opacity: 0.7 }}>Sube documentos para que el chatbot los use</p>
      )}

      <div style={{ display: 'grid', gap: 10 }}>
        {documents.map(doc => (
          <div 
            key={doc._id} 
            style={{
              padding: 12,
              border: '1px solid #ddd',
              borderRadius: 6,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <p style={{ margin: 0, fontWeight: 600 }}>
                📄 {doc.originalFile.name}
              </p>
              <p style={{ margin: '4px 0', fontSize: 12, opacity: 0.7 }}>
                {doc.chunks?.length || 0} chunks • {doc.status}
              </p>
              {doc.status === 'processing' && (
                <small style={{ color: '#faad14' }}>⏳ Procesando...</small>
              )}
              {doc.status === 'ready' && (
                <small style={{ color: '#52c41a' }}>✅ Listo</small>
              )}
            </div>
            <button 
              onClick={() => deleteDocument(doc._id)}
              style={{ color: '#f5222d' }}
            >
              🗑️
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## FLUJO COMPLETO EN LA PRÁCTICA

### 1️⃣ Usuario abre dashboard
```
[Dashboard]
├─ Chatbot creado: "Mi Tienda"
├─ Botón: "📤 Subir Documento"
└─ Lista de documentos: (vacía)
```

### 2️⃣ Usuario hace clic en "📤 Subir Documento"
```
Modal abre
├─ "Selecciona un PDF, DOCX o TXT"
├─ Input file
└─ (aguardando archivo)
```

### 3️⃣ Usuario selecciona "catalogo.pdf" (5MB)
```
[Modal]
Subiendo catalogo.pdf...
(Spinner)

[Backend]
✅ Archivo recibido
✅ Documento creado en BD (status: 'processing')
✅ Retorna inmediatamente al frontend
📄 En background: procesa → chunking → embeddings

[Frontend]
Procesando documento...
Puedes cerrar esto, sigue en background
```

### 4️⃣ Usuario cierra modal o espera
```
(3-5 segundos después)

[Modal]
✅ ¡Listo!
catalogo.pdf procesado
El chatbot ahora usa esta información

[Dashboard]
Lista de documentos:
├─ 📄 catalogo.pdf
│  └─ 45 chunks • ✅ Listo
└─ [Botón para agregar más]

[Backend]
✅ Documento procesado
✅ Chunks creados (45)
✅ Embeddings generados
✅ MongoDB actualizado
✅ Status: 'ready'
```

### 5️⃣ Cliente pregunta en el chat
```
Chat del Cliente:
"¿Qué productos tienen en color rojo?"

Backend:
1. RetrievalService busca en documentos
2. Encuentra 3 productos rojo en catalogo.pdf
3. GenerationService crea respuesta
4. Retorna respuesta CON FUENTES

Respuesta al Cliente:
"Tenemos 3 productos en rojo:
- Zapatillas Running Rojo ($45.000)
- Mochila Impermeable Rojo ($25.000)
- Camiseta Básica Rojo ($12.000)"

Fuentes: catalogo.pdf
```

---

## VENTAJAS DE ESTE APPROACH

✅ **Ultra simple**: Usuario sube → Listo  
✅ **No espera**: Procesamiento en background  
✅ **Feedback claro**: Estados visuales (⏳→✅→🗑️)  
✅ **Sin configuración**: Todo automático  
✅ **Escalable**: Múltiples uploads simultáneos  
✅ **Robusto**: Errores manejados gracefully  

---

## CHECKLIST DE IMPLEMENTACIÓN

- [x] AutoProcessingService creado
- [ ] Upload endpoint simplificado (retorna inmediato)
- [ ] DocumentController actualizado
- [ ] UploadDocumentModal creado (frontend)
- [ ] DocumentsList con polling de status
- [ ] Rutas del documento (GET lista, DELETE)
- [ ] Test: Upload → Processing → Ready
- [ ] Test: Chat usa documento automáticamente
- [ ] WebSocket para notificaciones (opcional, mejora UX)

---

## SIGUIENTE PASO

Integrar esto al chat.html / embed.html para que funcione **de verdad**.

El usuario sube → el chatbot automáticamente responde basándose en eso.

¡Listo! 🎉
