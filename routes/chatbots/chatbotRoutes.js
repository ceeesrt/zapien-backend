import express from 'express';
import ChatbotController from '../../controllers/chatbots/chatbot.controller.js';
import DocumentRoutes from '../documents/documentRoutes.js';
import ConversationRoutes from '../conversations/conversationRoutes.js';
import ProductRoutes from '../products/productRoutes.js';
import ConfigRoutes from '../config.routes.js';
import LeadsRoutes from './leads.routes.js';
import QuotesRoutes from './quotes.routes.js';
import AppointmentsRoutes from './appointments.routes.js';

const router = express.Router({ mergeParams: true });
const chatbotController = new ChatbotController();

// Chatbot CRUD
router.get('/', chatbotController.list);
router.post('/', chatbotController.create);
router.get('/:id', chatbotController.get);
router.patch('/:id', chatbotController.update);
router.delete('/:id', chatbotController.delete);

// Chatbot actions
router.post('/:id/activate', chatbotController.activate);
router.post('/:id/pause', chatbotController.pause);
router.get('/:id/embed-code', chatbotController.getEmbedCode);
router.get('/:id/stats', chatbotController.getStats);

// OpenAI configuration
router.patch('/:id/openai-config', chatbotController.updateOpenaiConfig);
router.get('/:id/openai-config', chatbotController.getOpenaiConfig);

// Calendar OAuth endpoints
router.patch('/:id/google-oauth', chatbotController.updateGoogleOAuthConfig);
router.get('/:id/calendar/auth-url', chatbotController.getCalendarAuthUrl);

// Nested routes for documents, conversations and products
router.use('/:id/documents', DocumentRoutes);
router.use('/:id/conversations', ConversationRoutes);
router.use('/:id/products', ProductRoutes);
router.use('/:id/config', ConfigRoutes);
router.use('/:id/leads', LeadsRoutes);
router.use('/:id/quotes', QuotesRoutes);
router.use('/:id/appointments', AppointmentsRoutes);

export default router;
