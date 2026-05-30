import { google } from 'googleapis';
import Chatbot from '../../models/Chatbot.js';
import Appointment from '../../models/Appointment.js';

class CalendarService {
  /**
   * Obtiene URL de autorización de Google
   */
  getAuthorizationUrl(chatbotId, redirectUri, googleClientId, googleClientSecret) {
    // Si no se proporcionan credenciales del chatbot, usar las del .env (fallback)
    const clientId = googleClientId || process.env.GOOGLE_CLIENT_ID;
    const clientSecret = googleClientSecret || process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured');
    }

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    const scopes = [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar'
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: chatbotId
    });

    return authUrl;
  }

  /**
   * Obtiene tokens de autorización
   */
  async getTokens(code, redirectUri, googleClientId, googleClientSecret) {
    try {
      // Si no se proporcionan credenciales del chatbot, usar las del .env (fallback)
      const clientId = googleClientId || process.env.GOOGLE_CLIENT_ID;
      const clientSecret = googleClientSecret || process.env.GOOGLE_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        throw new Error('Google OAuth credentials not configured');
      }

      const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
      );

      const { tokens } = await oauth2Client.getToken(code);
      return { success: true, tokens };
    } catch (error) {
      console.error('❌ Error obteniendo tokens:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtiene eventos disponibles del calendario
   */
  async getAvailableSlots(chatbotId, accessToken, startDate, endDate) {
    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );

      oauth2Client.setCredentials({ access_token: accessToken });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      const events = await calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date(startDate).toISOString(),
        timeMax: new Date(endDate).toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
      });

      return { success: true, events: events.data.items || [] };
    } catch (error) {
      console.error('❌ Error obteniendo eventos:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Crea evento de cita en Google Calendar
   */
  async createCalendarEvent(chatbotId, accessToken, appointmentData) {
    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );

      oauth2Client.setCredentials({ access_token: accessToken });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      const event = {
        summary: `Cita: ${appointmentData.customerName}`,
        description: `Razón: ${appointmentData.reason || 'No especificada'}\nTeléfono: ${appointmentData.customerPhone || 'N/A'}\nEmail: ${appointmentData.customerEmail || 'N/A'}`,
        start: {
          dateTime: new Date(appointmentData.scheduledAt).toISOString(),
          timeZone: 'America/Santiago'
        },
        end: {
          dateTime: new Date(new Date(appointmentData.scheduledAt).getTime() + appointmentData.durationMinutes * 60000).toISOString(),
          timeZone: 'America/Santiago'
        },
        attendees: appointmentData.customerEmail ? [{ email: appointmentData.customerEmail }] : []
      };

      const createdEvent = await calendar.events.insert({
        calendarId: 'primary',
        resource: event,
        sendNotifications: true
      });

      console.log(`✅ Evento creado en Google Calendar: ${createdEvent.data.id}`);

      return {
        success: true,
        calendarEventId: createdEvent.data.id,
        calendarEventUrl: createdEvent.data.htmlLink
      };
    } catch (error) {
      console.error('❌ Error creando evento:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Actualiza evento en Google Calendar
   */
  async updateCalendarEvent(accessToken, eventId, appointmentData) {
    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );

      oauth2Client.setCredentials({ access_token: accessToken });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      const event = {
        summary: `Cita: ${appointmentData.customerName}`,
        description: `Razón: ${appointmentData.reason || 'No especificada'}`,
        start: {
          dateTime: new Date(appointmentData.scheduledAt).toISOString(),
          timeZone: 'America/Santiago'
        },
        end: {
          dateTime: new Date(new Date(appointmentData.scheduledAt).getTime() + appointmentData.durationMinutes * 60000).toISOString(),
          timeZone: 'America/Santiago'
        }
      };

      await calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        resource: event
      });

      console.log(`✅ Evento actualizado en Google Calendar: ${eventId}`);

      return { success: true };
    } catch (error) {
      console.error('❌ Error actualizando evento:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Elimina evento de Google Calendar
   */
  async deleteCalendarEvent(accessToken, eventId) {
    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );

      oauth2Client.setCredentials({ access_token: accessToken });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      await calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId
      });

      console.log(`✅ Evento eliminado de Google Calendar: ${eventId}`);

      return { success: true };
    } catch (error) {
      console.error('❌ Error eliminando evento:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new CalendarService();
