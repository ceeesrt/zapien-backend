import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import path from 'path';

// Routes
import AuthRoutes from './routes/auth/authRoutes.js';
import WorkspaceRoutes from './routes/workspaces/workspaceRoutes.js';
import ChatbotRoutes from './routes/chatbots/chatbotRoutes.js';
import LeadRoutes from './routes/leads/leadRoutes.js';
import AppointmentRoutes from './routes/appointments/appointmentRoutes.js';
import QuoteRoutes from './routes/quotes/quoteRoutes.js';
import IntegrationRoutes from './routes/integrations/integrationRoutes.js';
import BillingRoutes from './routes/billing/billingRoutes.js';
import EmbedRoutes from './routes/embed/embedRoutes.js';
import WebhookRoutes from './routes/webhooks/webhookRoutes.js';

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

// API Routes
app.use('/api/auth', AuthRoutes);
app.use('/api/workspaces', WorkspaceRoutes);
app.use('/api/chatbots', ChatbotRoutes);
app.use('/api/integrations', IntegrationRoutes);
app.use('/api/billing', BillingRoutes);

// Public endpoints (embed + webhooks)
app.use('/api/embed', EmbedRoutes);
app.use('/api/webhooks', WebhookRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor corriendo en http://0.0.0.0:${PORT}`);
});
