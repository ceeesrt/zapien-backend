# 🚀 Guía de Configuración - Zapien Chatbot System

## ✅ Sistema Implementado

### Core Features (Listo para Producción)
- ✅ Autenticación JWT con refresh tokens
- ✅ Crear/Editar chatbots con wizard dinámico
- ✅ Integración con OpenAI (GPT-3.5/GPT-4)
- ✅ Procesamiento de documentos (PDF, DOCX, TXT)
- ✅ Búsqueda RAG (contexto automático)
- ✅ Widget embed para chat
- ✅ **Respuestas automáticas en Instagram** (Meta API)
- ✅ **Respuestas automáticas en WhatsApp** (Twilio API)
- ✅ Agendar citas con Google Calendar
- ✅ Captura de leads
- ✅ Generación de cotizaciones
- ✅ Gestión de productos con imágenes
- ✅ Notificaciones por email
- ✅ Almacenamiento local

---

## 📋 Pasos de Configuración

### 1. Variables de Entorno (.env)

```
# Base
MONGO_URI=tu_mongodb_uri
JWT_SECRET=tu_jwt_secret
PORT=5001
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
ENCRYPTION_KEY=clave_encriptacion_32_caracteres

# OpenAI (Usuario proporciona su propia key)
OPENAI_API_TIMEOUT=30000
OPENAI_MAX_TOKENS_PER_REQUEST=4000

# Google Calendar OAuth
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5001/api/calendar/oauth/callback
BACKEND_URL=http://localhost:5001
FRONTEND_URL=http://localhost:5173

# Email Notifications (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASSWORD=tu_app_password

# Instagram
INSTAGRAM_VERIFY_TOKEN=tu_instagram_verify_token

# Twilio (WhatsApp)
TWILIO_ACCOUNT_SID=tu_twilio_account_sid
TWILIO_AUTH_TOKEN=tu_twilio_auth_token
```

---

### 2. Google Calendar Setup

#### 2.1 Crear OAuth App en Google Cloud Console
1. Ir a https://console.cloud.google.com/
2. Crear nuevo proyecto "Zapien"
3. Habilitar "Google Calendar API"
4. Crear credenciales (OAuth 2.0 Client ID)
5. Tipo: "Web application"
6. Authorized redirect URIs: `http://localhost:5001/api/calendar/oauth/callback`
7. Descargar JSON y copiar `client_id` y `client_secret` al .env

#### 2.2 En el Dashboard
1. Ir a Chatbot > Configuración
2. Buscar sección "Integraciones"
3. Click en "Conectar Google Calendar"
4. Autorizar acceso a Google
5. ✅ Listo - Las citas se sincronizarán automáticamente

---

### 3. Email Notifications Setup

#### 3.1 Si usas Gmail
1. Habilitar 2FA en Google
2. Generar "App Password": https://myaccount.google.com/apppasswords
3. Usar ese password en `SMTP_PASSWORD`

#### 3.2 En el Backend
- Las confirmaciones se envían automáticamente:
  - ✉️ Cuando se crea una cita
  - ✉️ Cuando se captura un lead
  - ✉️ Cuando se genera una cotización

---

### 4. WhatsApp Integration (Twilio)

#### 4.1 Crear Cuenta en Twilio
1. Ir a https://www.twilio.com/
2. Crear cuenta y verificar teléfono
3. Obtener:
   - Account SID
   - Auth Token
   - Número de WhatsApp (twilio sandbox o número real)

#### 4.2 En el Dashboard
1. Ir a Chatbot > Configuración
2. Sección "WhatsApp"
3. Ingresar:
   - Account SID
   - Auth Token
   - Número de WhatsApp
4. ✅ Habilitado

#### 4.3 Configurar Webhook
En Twilio Console:
1. Ir a "Messaging" > "Try it out" > "Send a Webhook Message"
2. Configurar webhook URL: `https://tudominio.com/api/messaging/whatsapp/webhook`
3. El chatbot responderá automáticamente

---

### 5. Instagram Integration (Meta)

#### 5.1 Crear Facebook App
1. Ir a https://developers.facebook.com/
2. Crear app > "Business"
3. Agregar producto "Messenger"
4. Obtener Page Access Token

#### 5.2 En el Dashboard
1. Ir a Chatbot > Configuración
2. Sección "Instagram"
3. Ingresar:
   - Business Account ID
   - Access Token
4. ✅ Habilitado

#### 5.3 Configurar Webhook
En Meta App Dashboard:
1. Ir a "Messenger" > "Webhooks"
2. Configurar callback URL: `https://tudominio.com/api/messaging/instagram/webhook`
3. Verify Token: `zapien_instagram_verify_token_2024` (del .env)
4. Suscribirse a evento `messages`
5. El chatbot responderá automáticamente

---

### 6. OpenAI Configuration

#### Usuario debe proporcionar:
1. API Key de OpenAI (desde https://platform.openai.com/api-keys)
2. En Dashboard > Chatbot > OpenAI:
   - Pegar API Key
   - Seleccionar modelo (GPT-3.5, GPT-4, etc)
   - Ajustar temperatura y max tokens

#### Backend:
- API Key se encripta en BD con AES-256
- No se expone en respuestas API
- Cada usuario paga directamente a OpenAI

---

## 🎯 Flujos Completos

### Flujo Widget Chat
```
Cliente envía mensaje en widget
    ↓
Se buscan documentos relevantes (RAG)
    ↓
OpenAI genera respuesta con contexto
    ↓
Se guarda en BD
    ↓
Se retorna al widget
```

### Flujo Instagram/WhatsApp
```
Cliente envía en Instagram/WhatsApp
    ↓
Webhook recibe el mensaje
    ↓
Se buscan documentos relevantes
    ↓
OpenAI genera respuesta
    ↓
✨ SE ENVÍA AUTOMÁTICAMENTE al cliente
    ↓
Se guarda en conversación
```

### Flujo Citas
```
Cliente pide agendar cita
    ↓
Sistema muestra slots disponibles de Google Calendar
    ↓
Cliente elige slot
    ↓
Se crea cita en BD
    ↓
Se crea evento en Google Calendar
    ↓
✉️ Email de confirmación al cliente
    ↓
Se muestra enlace a evento en Google Calendar
```

---

## 📊 Endpoints Clave

### Autenticación
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

### Chatbots
- `POST /api/workspaces/:wsId/chatbots`
- `GET /api/workspaces/:wsId/chatbots`
- `PATCH /api/workspaces/:wsId/chatbots/:cbId`

### OpenAI
- `PATCH /api/workspaces/:wsId/chatbots/:cbId/openai-config`
- `GET /api/workspaces/:wsId/chatbots/:cbId/openai-config`

### Documentos
- `POST /api/workspaces/:wsId/chatbots/:cbId/documents` (upload)
- `GET /api/workspaces/:wsId/chatbots/:cbId/documents`

### Productos
- `POST /api/workspaces/:wsId/chatbots/:cbId/products` (con imagen)
- `GET /api/workspaces/:wsId/chatbots/:cbId/products`

### Citas
- `POST /api/workspaces/:wsId/chatbots/:cbId/appointments`
- `GET /api/calendar/auth-url/:chatbotId` (OAuth)

### Webhooks (Públicos)
- `POST /api/messaging/whatsapp/webhook`
- `POST /api/messaging/instagram/webhook`
- `GET /api/messaging/instagram/webhook` (verificación)

### Widget
- `POST /api/embed/messages` (enviar mensaje)

---

## 🧪 Testing

### Test Rápido (5 min)
1. Login con credenciales
2. Crear chatbot
3. Configurar OpenAI (test key)
4. Subir documento PDF
5. Enviar mensaje en widget
6. ✅ Verificar respuesta de OpenAI

### Test Completo
1. Seguir todos los pasos de configuración
2. Probar cada integración (Google Calendar, WhatsApp, Instagram)
3. Enviar mensajes desde cada canal
4. Verificar emails de confirmación
5. Verificar que eventos aparecen en Google Calendar

---

## ⚠️ Notas Importantes

### Seguridad
- ✅ API Keys encriptadas con AES-256
- ✅ JWT con expiración
- ✅ CORS configurado
- ✅ Validación en endpoints
- ⚠️ En producción: usar HTTPS, cambiar ENCRYPTION_KEY

### Costos
- OpenAI: Usuario paga directamente
- Google Calendar: Gratis (API incluida)
- Email: Gratis con Gmail (SMTP)
- Twilio: Pago por uso
- Meta: Gratis (webhooks)

### Límites
- Tamaño máximo de documento: 25MB
- Tamaño máximo de imagen: 5MB
- Tokens por request OpenAI: 4000 (configurable)
- Chunks de documentos: ~500 tokens

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs del servidor
2. Verifica las variables de .env
3. Asegúrate de que los servicios externos estén disponibles
4. Revisa que los webhooks estén correctamente configurados

¡El sistema está listo para producción! 🚀
