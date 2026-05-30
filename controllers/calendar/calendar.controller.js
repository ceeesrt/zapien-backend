import Chatbot from '../../models/Chatbot.js';
import calendarService from '../../services/calendar/calendar.service.js';

export default class CalendarController {
  /**
   * Obtiene URL de autorización para Google Calendar
   */
  getAuthUrl = async (req, res) => {
    try {
      const { chatbotId } = req.params;

      // Obtener el chatbot para verificar credenciales
      const chatbot = await Chatbot.findById(chatbotId);
      if (!chatbot) {
        return res.status(404).json({
          success: false,
          message: 'Chatbot no encontrado'
        });
      }

      const googleClientId = chatbot.integrations?.calendar?.googleClientId;
      const googleClientSecret = chatbot.integrations?.calendar?.googleClientSecret;

      if (!googleClientId || !googleClientSecret) {
        return res.status(400).json({
          success: false,
          message: 'Credenciales de Google no configuradas'
        });
      }

      const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:5001'}/api/calendar/oauth/callback`;
      const authUrl = calendarService.getAuthorizationUrl(chatbotId, redirectUri, googleClientId, googleClientSecret);

      return res.json({
        success: true,
        authUrl
      });
    } catch (error) {
      console.error('❌ CalendarController.getAuthUrl:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Error obteniendo URL de autorización'
      });
    }
  };

  /**
   * Callback de OAuth de Google
   */
  oauthCallback = async (req, res) => {
    try {
      const { code, state } = req.query;
      const chatbotId = state;

      if (!code || !chatbotId) {
        return res.status(400).json({
          success: false,
          message: 'Parámetros inválidos'
        });
      }

      // Obtener el chatbot para recuperar sus credenciales
      const chatbot = await Chatbot.findById(chatbotId);
      if (!chatbot) {
        return res.status(404).json({
          success: false,
          message: 'Chatbot no encontrado'
        });
      }

      const googleClientId = chatbot.integrations?.calendar?.googleClientId;
      const googleClientSecret = chatbot.integrations?.calendar?.googleClientSecret;

      if (!googleClientId || !googleClientSecret) {
        return res.status(400).json({
          success: false,
          message: 'Credenciales de Google no configuradas'
        });
      }

      const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:5001'}/api/calendar/oauth/callback`;
      const tokensResult = await calendarService.getTokens(code, redirectUri, googleClientId, googleClientSecret);

      if (!tokensResult.success) {
        return res.status(400).json({
          success: false,
          message: tokensResult.error
        });
      }

      const { access_token, refresh_token } = tokensResult.tokens;

      // Guardar tokens en chatbot
      await Chatbot.findByIdAndUpdate(chatbotId, {
        'integrations.calendar.accessToken': access_token,
        'integrations.calendar.refreshToken': refresh_token,
        'integrations.calendar.connectedAt': new Date()
      });

      // Redirigir al dashboard
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?calendar=connected`);
    } catch (error) {
      console.error('❌ CalendarController.oauthCallback:', error);
      return res.status(500).json({
        success: false,
        message: 'Error en autenticación'
      });
    }
  };

  /**
   * Obtiene disponibilidad
   */
  getAvailableSlots = async (req, res) => {
    try {
      const { chatbotId } = req.params;
      const { startDate, endDate } = req.query;

      const chatbot = await Chatbot.findById(chatbotId);
      if (!chatbot?.integrations?.calendar?.accessToken) {
        return res.status(400).json({
          success: false,
          message: 'Google Calendar no configurado'
        });
      }

      const result = await calendarService.getAvailableSlots(
        chatbotId,
        chatbot.integrations.calendar.accessToken,
        startDate,
        endDate
      );

      return res.json(result);
    } catch (error) {
      console.error('❌ CalendarController.getAvailableSlots:', error);
      return res.status(500).json({
        success: false,
        message: 'Error obteniendo disponibilidad'
      });
    }
  };

  /**
   * Desconecta Google Calendar
   */
  disconnect = async (req, res) => {
    try {
      const { chatbotId } = req.params;

      await Chatbot.findByIdAndUpdate(chatbotId, {
        'integrations.calendar.accessToken': null,
        'integrations.calendar.refreshToken': null,
        'integrations.calendar.connectedAt': null
      });

      return res.json({
        success: true,
        message: 'Google Calendar desconectado'
      });
    } catch (error) {
      console.error('❌ CalendarController.disconnect:', error);
      return res.status(500).json({
        success: false,
        message: 'Error desconectando'
      });
    }
  };
}
