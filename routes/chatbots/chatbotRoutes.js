import express from 'express';
import ChatbotController from '../../controllers/chatbots/chatbot.controller.js';
import DocumentRoutes from '../documents/documentRoutes.js';
import ConversationRoutes from '../conversations/conversationRoutes.js';

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

// Nested routes for documents and conversations
router.use('/:id/documents', DocumentRoutes);
router.use('/:id/conversations', ConversationRoutes);

export default router;
