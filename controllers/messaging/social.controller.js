import socialService from '../../services/messaging/social.service.js';



export default class SocialController {
  handleWhatsAppWebhook = async (req, res) => {
    try {
      const { From, To, Body, MessageSid } = req.body;

      const response = await socialService.handleWhatsAppMessage({
        from: From,
        to: To,
        body: Body,
        messageSid: MessageSid
      });

      res.status(response.success ? 200 : 400).json(response);
    } catch (error) {
      console.error('❌ SocialController.handleWhatsAppWebhook:', error);
      res.status(500).json({
        success: false,
        message: 'Error procesando webhook de WhatsApp'
      });
    }
  };

  handleInstagramWebhook = async (req, res) => {
    try {
      const { entry } = req.body;

      if (!entry || !entry[0]) {
        return res.status(400).json({ success: false });
      }

      const messagingEvents = entry[0].messaging || [];

      for (const event of messagingEvents) {
        if (event.message) {
          const response = await socialService.handleInstagramMessage({
            from: event.sender.id,
            to: event.recipient.id,
            text: event.message.text,
            mid: event.message.mid
          });
        }
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('❌ SocialController.handleInstagramWebhook:', error);
      res.status(500).json({
        success: false,
        message: 'Error procesando webhook de Instagram'
      });
    }
  };

  verifyInstagramWebhook = (req, res) => {
    const verifyToken = process.env.INSTAGRAM_VERIFY_TOKEN;
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (token === verifyToken) {
      res.send(challenge);
    } else {
      res.status(403).json({ success: false });
    }
  };

  getIntegrationStatus = async (req, res) => {
    try {
      const { chatbotId } = req.params;

      const response = await socialService.getIntegrationStatus(chatbotId);

      res.status(response.success ? 200 : 400).json(response);
    } catch (error) {
      console.error('❌ SocialController.getIntegrationStatus:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo estado de integraciones'
      });
    }
  };
}
