import express from 'express';
import EmbedController from '../../controllers/embed/embed.controller.js';

const router = express.Router();
const embedController = new EmbedController();

// Public endpoints (validados por embedKey, sin auth)
router.post('/conversations', embedController.startConversation);
router.post('/messages', embedController.sendMessage);
router.post('/lead', embedController.captureLead);
router.post('/quote', embedController.requestQuote);
router.post('/appointment', embedController.requestAppointment);
router.get('/availability', embedController.getAvailability);
router.get('/products', embedController.searchProducts);

export default router;
