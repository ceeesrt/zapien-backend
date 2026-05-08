import ConversationService from '../../services/conversations/conversation.service.js';

const conversationService = new ConversationService();

export default class ConversationController {
    list = async (req, res) => {
        try {
            const { id: chatbotId } = req.params;
            const { status, startDate, endDate, search } = req.query;
            const filters = { status, startDate, endDate, search };
            const response = await conversationService.listConversations(chatbotId, filters);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ ConversationController.list:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al listar conversaciones'
            });
        }
    };

    get = async (req, res) => {
        try {
            const { conversationId } = req.params;
            const response = await conversationService.getConversation(conversationId);
            return res.status(response.success ? 200 : 404).json(response);
        } catch (error) {
            console.error('❌ ConversationController.get:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener conversación'
            });
        }
    };

    getMessages = async (req, res) => {
        try {
            const { conversationId } = req.params;
            const response = await conversationService.getMessages(conversationId);
            return res.status(response.success ? 200 : 404).json(response);
        } catch (error) {
            console.error('❌ ConversationController.getMessages:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener mensajes'
            });
        }
    };

    close = async (req, res) => {
        try {
            const { conversationId } = req.params;
            const response = await conversationService.closeConversation(conversationId);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ ConversationController.close:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al cerrar conversación'
            });
        }
    };

    markSpam = async (req, res) => {
        try {
            const { conversationId } = req.params;
            const response = await conversationService.markAsSpam(conversationId);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ ConversationController.markSpam:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al marcar como spam'
            });
        }
    };
}
