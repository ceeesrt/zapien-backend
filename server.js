import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import path from 'path';

import ExampleRoutes from './routes/example/exampleRoutes.js';

dotenv.config();

const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').filter(o => o.trim());

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('CORS bloqueado'), false);
    },
    credentials: true,
}));

app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: './tmp',
    createParentPath: true,
}));

app.use(express.json());

app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

// Una sola ruta de ejemplo
app.use('/api/example', ExampleRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor corriendo en http://0.0.0.0:${PORT}`);
});
