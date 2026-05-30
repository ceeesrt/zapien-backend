import Chatbot from '../../models/Chatbot.js';
import Conversation from '../../models/Conversation.js';
import Message from '../../models/Message.js';
import twilio from 'twilio';
import axios from 'axios';

class SocialService {
  /**
   * Procesa mensajes entrantes de WhatsApp (Twilio)
   */
  async handleWhatsAppMessage(messageData) {
    try {
      const { from, to, body } = messageData;

      // Buscar chatbot por número de WhatsApp
      const chatbot = await Chatbot.findOne({
        'integrations.whatsapp.phoneNumber': to,
        'integrations.whatsapp.enabled': true
      });

      if (!chatbot) {
        return { success: false, message: 'Chatbot no encontrado' };
      }

      // Buscar o crear conversación por número de teléfono del visitante
      let conversation = await Conversation.findOne({
        chatbotId: chatbot._id,
        visitorId: from,
        source: 'whatsapp'
      });

      if (!conversation) {
        conversation = new Conversation({
          chatbotId: chatbot._id,
          workspaceId: chatbot.workspaceId,
          visitorId: from,
          visitorMetadata: { phone: from, channel: 'whatsapp' },
          status: 'active',
          source: 'whatsapp'
        });
        await conversation.save();
      }

      // Guardar mensaje del usuario
      await Message.create({
        conversationId: conversation._id,
        chatbotId: chatbot._id,
        role: 'user',
        content: body,
        metadata: {
          channel: 'whatsapp',
          externalId: messageData.messageSid
        }
      });

      return {
        success: true,
        message: 'Mensaje procesado',
        data: { conversationId: conversation._id }
      };
    } catch (error) {
      console.error('❌ SocialService.handleWhatsAppMessage:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Procesa mensajes entrantes de Instagram (Meta)
   */
  async handleInstagramMessage(messageData) {
    try {
      const { from, to, text } = messageData;

      // Buscar chatbot por Instagram Business Account ID
      const chatbot = await Chatbot.findOne({
        'integrations.instagram.instagramBusinessAccountId': to,
        'integrations.instagram.enabled': true
      });

      if (!chatbot) {
        return { success: false, message: 'Chatbot no encontrado' };
      }

      // Buscar o crear conversación por ID del usuario de Instagram
      let conversation = await Conversation.findOne({
        chatbotId: chatbot._id,
        visitorId: from,
        source: 'instagram'
      });

      if (!conversation) {
        conversation = new Conversation({
          chatbotId: chatbot._id,
          workspaceId: chatbot.workspaceId,
          visitorId: from,
          visitorMetadata: { instagramId: from, channel: 'instagram' },
          status: 'active',
          source: 'instagram'
        });
        await conversation.save();
      }

      // Guardar mensaje del usuario
      await Message.create({
        conversationId: conversation._id,
        chatbotId: chatbot._id,
        role: 'user',
        content: text,
        metadata: {
          channel: 'instagram',
          externalId: messageData.mid
        }
      });

      return {
        success: true,
        message: 'Mensaje procesado',
        data: { conversationId: conversation._id }
      };
    } catch (error) {
      console.error('❌ SocialService.handleInstagramMessage:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Envía un mensaje a WhatsApp (usando Twilio)
   */
  async sendWhatsAppMessage(chatbotId, phoneNumber, messageText) {
    try {
      const chatbot = await Chatbot.findById(chatbotId);

      if (!chatbot?.integrations?.whatsapp?.enabled) {
        return { success: false, message: 'WhatsApp no está configurado' };
      }

      const { accountSid, authToken, phoneNumber: botPhone } = chatbot.integrations.whatsapp;

      // Validar credenciales
      if (!accountSid || !authToken || !botPhone) {
        return { success: false, message: 'Credenciales de WhatsApp incompletas' };
      }

      // Crear cliente de Twilio
      const client = twilio(accountSid, authToken);

      // Enviar mensaje
      const message = await client.messages.create({
        from: `whatsapp:${botPhone}`,
        to: `whatsapp:${phoneNumber}`,
        body: messageText
      });

      console.log(`✅ Mensaje WhatsApp enviado: ${message.sid}`);

      return {
        success: true,
        message: 'Mensaje enviado a WhatsApp',
        data: { messageSid: message.sid }
      };
    } catch (error) {
      console.error('❌ SocialService.sendWhatsAppMessage:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Envía un mensaje a Instagram (usando Meta API)
   */
  async sendInstagramMessage(chatbotId, userId, messageText) {
    try {
      const chatbot = await Chatbot.findById(chatbotId);

      if (!chatbot?.integrations?.instagram?.enabled) {
        return { success: false, message: 'Instagram no está configurado' };
      }

      const { accessToken, instagramBusinessAccountId } = chatbot.integrations.instagram;

      // Validar credenciales
      if (!accessToken || !instagramBusinessAccountId) {
        return { success: false, message: 'Credenciales de Instagram incompletas' };
      }

      // Llamar API de Meta para enviar mensaje
      const response = await axios.post(
        `https://graph.instagram.com/v18.0/${instagramBusinessAccountId}/messages`,
        {
          recipient: { id: userId },
          message: { text: messageText }
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );

      console.log(`✅ Mensaje Instagram enviado: ${response.data.message_id}`);

      return {
        success: true,
        message: 'Mensaje enviado a Instagram',
        data: { messageId: response.data.message_id }
      };
    } catch (error) {
      console.error('❌ SocialService.sendInstagramMessage:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Obtiene estado de integración
   */
  async getIntegrationStatus(chatbotId) {
    try {
      const chatbot = await Chatbot.findById(chatbotId);

      return {
        success: true,
        data: {
          whatsapp: {
            enabled: chatbot?.integrations?.whatsapp?.enabled || false,
            provider: chatbot?.integrations?.whatsapp?.provider,
            connectedAt: chatbot?.integrations?.whatsapp?.connectedAt
          },
          instagram: {
            enabled: chatbot?.integrations?.instagram?.enabled || false,
            connectedAt: chatbot?.integrations?.instagram?.connectedAt
          }
        }
      };
    } catch (error) {
      console.error('❌ SocialService.getIntegrationStatus:', error);
      return { success: false, message: error.message };
    }
  }
}

export default new SocialService();
