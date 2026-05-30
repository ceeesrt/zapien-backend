import { Conversation, Message } from '../../models/index.js';

export default class ConversationService {
    list = async (chatbotId, filters = {}) => {
        try {
            let query = { chatbotId };
            if (filters.status) query.status = filters.status;
            if (filters.search) query['visitorMetadata.name'] = { $regex: filters.search, $options: 'i' };

            const conversations = await Conversation.find(query).sort({ lastMessageAt: -1 });
            return { success: true, message: 'Conversaciones obtenidas', data: conversations };
        } catch (error) {
            console.error('❌ ConversationService.list:', error);
            return { success: false, message: error.message };
        }
    };

    get = async (conversationId) => {
        try {
            const conversation = await Conversation.findById(conversationId);
            if (!conversation) return { success: false, message: 'Conversación no encontrada' };
            return { success: true, message: 'Conversación obtenida', data: conversation };
        } catch (error) {
            console.error('❌ ConversationService.get:', error);
            return { success: false, message: error.message };
        }
    };

    getMessages = async (conversationId) => {
        try {
            const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });
            return { success: true, message: 'Mensajes obtenidos', data: messages };
        } catch (error) {
            console.error('❌ ConversationService.getMessages:', error);
            return { success: false, message: error.message };
        }
    };

    close = async (conversationId) => {
        try {
            await Conversation.updateOne({ _id: conversationId }, { status: 'closed', closedAt: new Date() });
            return { success: true, message: 'Conversación cerrada' };
        } catch (error) {
            console.error('❌ ConversationService.close:', error);
            return { success: false, message: error.message };
        }
    };

    markSpam = async (conversationId) => {
        try {
            await Conversation.updateOne({ _id: conversationId }, { status: 'spam' });
            return { success: true, message: 'Conversación marcada como spam' };
        } catch (error) {
            console.error('❌ ConversationService.markSpam:', error);
            return { success: false, message: error.message };
        }
    };
}
