# Zapien Backend - Proyecto Base

Proyecto esqueleto de API REST en Node.js con Express y MongoDB. Diseñado como plantilla para iniciar nuevos proyectos backend.

## Stack

- **Node.js** con ES modules (`"type": "module"`)
- **Express** - framework web
- **MongoDB** con Mongoose - base de datos
- **CORS** - manejo de solicitudes entre orígenes
- **dotenv** - variables de entorno

## Estructura de carpetas

```
/
├── config/           # Configuración de la aplicación
├── controllers/      # Controladores por dominio (ej: example/)
├── libs/            # Módulos reutilizables (conexión a MongoDB, etc.)
├── models/          # Esquemas y modelos de Mongoose
├── public/          # Archivos estáticos
│   └── uploads/     # Carpeta de subidas de archivos
├── routes/          # Rutas por dominio (ej: example/)
├── services/        # Lógica de negocio por dominio
├── utils/           # Utilidades
├── .env.example     # Ejemplo de variables de entorno
├── .gitignore
├── package.json
└── server.js        # Punto de entrada
```

## Flujo de una solicitud

```
Route → Controller → Service → Model (MongoDB)
```

Ejemplo: `GET /api/example/status`
1. **Route** (`routes/example/exampleRoutes.js`) - Define la ruta
2. **Controller** (`controllers/example/example.controller.js`) - Procesa la solicitud
3. **Service** (`services/example/example.service.js`) - Lógica de negocio
4. **Model** (`models/AppConfig.js`) - Interacción con MongoDB

## Instalación

1. **Clonar o copiar el proyecto**
   ```bash
   cd zapien-backend
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   ```
   Editar `.env` con tus credenciales de MongoDB:
   ```
   MONGO_URI=mongodb+srv://usuario:contraseña@cluster.mongodb.net/basedatos
   PORT=5001
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
   ```

4. **Ejecutar el servidor**
   ```bash
   # Desarrollo (con nodemon)
   npm run dev

   # Producción
   npm start
   ```

El servidor correrá en `http://0.0.0.0:5001` por defecto.

## Ejemplo de uso

### Obtener el estado de la app
```bash
curl http://localhost:5001/api/example/status
```

Respuesta esperada:
```json
{
  "success": true,
  "message": "Estado obtenido correctamente",
  "data": {
    "status": "active",
    "appVersion": "1.0.0"
  }
}
```

## Cómo usar como esqueleto

1. **Copiar la estructura** para un nuevo dominio
2. **Renombrar** carpetas y archivos según tu dominio (ej: `example` → `users`)
3. **Crear nuevo modelo** en `models/`
4. **Implementar servicio** en `services/tu-dominio/`
5. **Crear controlador** en `controllers/tu-dominio/`
6. **Definir rutas** en `routes/tu-dominio/`
7. **Montar en server.js**: `app.use('/api/tu-dominio', TuDominioRoutes)`

## Conexión a MongoDB

La conexión se gestiona en `libs/mongoose.js`:
- Se llama automáticamente desde el constructor del servicio
- La URI se lee de la variable de entorno `MONGO_URI`
- No hardcodear credenciales

## Respuestas estándar

Todos los endpoints deben responder con este formato:
```json
{
  "success": boolean,
  "message": string,
  "data": object (opcional)
}
```

## Notas

- El proyecto incluye `express-fileupload` para manejo de archivos
- Los archivos estáticos se sirven desde `/uploads`
- CORS está configurado por variable de entorno `ALLOWED_ORIGINS`
- Usar `.lean()` en queries de MongoDB para mejor rendimiento cuando no necesites documentos completos
