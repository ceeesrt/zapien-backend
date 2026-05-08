import express from 'express';
import ConversationController from '../../controllers/conversations/conversation.controller.js';

const router = express.Router({ mergeParams: true });
const conversationController = new ConversationController();

router.get('/', conversationController.list);
router.get('/:conversationId', conversationController.get);
router.get('/:conversationId/messages', conversationController.getMessages);
router.post('/:conversationId/close', conversationController.close);
router.post('/:conversationId/spam', conversationController.markSpam);

export default router;
