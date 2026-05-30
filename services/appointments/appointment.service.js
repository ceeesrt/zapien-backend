import Appointment from '../../models/Appointment.js';
import Chatbot from '../../models/Chatbot.js';
import calendarService from '../calendar/calendar.service.js';

class AppointmentService {
  /**
   * Obtiene horarios disponibles para un chatbot
   * Por ahora retorna bloques de 30 minutos en horario comercial (9-18)
   */
  async getAvailableSlots(chatbotId, workspaceId, startDate, endDate, durationMinutes = 30) {
    try {
      const slots = [];
      const currentDate = new Date(startDate);
      const end = new Date(endDate);

      // Generar bloques de 30 minutos desde 09:00 hasta 18:00
      while (currentDate < end) {
        const dayOfWeek = currentDate.getDay();

        // Skip weekends (0 = domingo, 6 = sábado)
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          const hour = currentDate.getHours();

          // Solo horario comercial (9-18)
          if (hour >= 9 && hour < 18) {
            // Verificar que no esté ocupado
            const existingAppointment = await Appointment.findOne({
              chatbotId,
              scheduledAt: {
                $gte: currentDate,
                $lt: new Date(currentDate.getTime() + durationMinutes * 60000)
              },
              status: { $in: ['scheduled', 'confirmed', 'completed'] }
            });

            if (!existingAppointment) {
              slots.push({
                startTime: new Date(currentDate),
                endTime: new Date(currentDate.getTime() + durationMinutes * 60000)
              });
            }
          }
        }

        // Avanzar 30 minutos
        currentDate.setMinutes(currentDate.getMinutes() + 30);
      }

      return slots;
    } catch (error) {
      console.error('Error getting available slots:', error);
      return [];
    }
  }

  /**
   * Crea una nueva cita
   */
  async createAppointment(chatbotId, workspaceId, appointmentData) {
    try {
      const appointment = new Appointment({
        chatbotId,
        workspaceId,
        ...appointmentData,
        status: 'scheduled'
      });

      await appointment.save();

      // Intentar crear evento en Google Calendar si está conectado
      try {
        const chatbot = await Chatbot.findById(chatbotId);
        if (chatbot?.integrations?.calendar?.accessToken) {
          console.log('📅 Creando evento en Google Calendar...');

          const calendarResult = await calendarService.createCalendarEvent(
            chatbotId,
            chatbot.integrations.calendar.accessToken,
            {
              customerName: appointmentData.customerName,
              customerEmail: appointmentData.customerEmail,
              customerPhone: appointmentData.customerPhone,
              reason: appointmentData.reason,
              scheduledAt: appointmentData.scheduledAt,
              durationMinutes: appointmentData.durationMinutes || 30
            }
          );

          if (calendarResult.success) {
            // Actualizar la cita con el ID del evento en Google Calendar
            await Appointment.findByIdAndUpdate(appointment._id, {
              calendarEventId: calendarResult.calendarEventId,
              calendarEventUrl: calendarResult.calendarEventUrl
            });

            console.log('✅ Evento creado en Google Calendar:', calendarResult.calendarEventId);
          } else {
            console.warn('⚠️ No se pudo crear evento en Google Calendar:', calendarResult.error);
          }
        }
      } catch (calendarError) {
        console.warn('⚠️ Error sincronizando con Google Calendar:', calendarError.message);
        // No fallar la cita si hay error con Google Calendar
      }

      return {
        success: true,
        message: 'Cita agendada exitosamente',
        data: appointment
      };
    } catch (error) {
      console.error('❌ AppointmentService.createAppointment:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Obtiene citas de un chatbot
   */
  async getAppointments(chatbotId, workspaceId, filters = {}) {
    try {
      const query = { chatbotId, workspaceId };

      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.startDate && filters.endDate) {
        query.scheduledAt = {
          $gte: new Date(filters.startDate),
          $lte: new Date(filters.endDate)
        };
      }

      const appointments = await Appointment.find(query).sort({ scheduledAt: -1 });

      return {
        success: true,
        message: 'Citas obtenidas',
        data: appointments
      };
    } catch (error) {
      console.error('❌ AppointmentService.getAppointments:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Actualiza estado de una cita
   */
  async updateAppointmentStatus(appointmentId, status) {
    try {
      const appointment = await Appointment.findByIdAndUpdate(
        appointmentId,
        { status },
        { new: true }
      );

      return {
        success: true,
        message: 'Cita actualizada',
        data: appointment
      };
    } catch (error) {
      console.error('❌ AppointmentService.updateAppointmentStatus:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Cancela una cita
   */
  async cancelAppointment(appointmentId) {
    try {
      const appointment = await Appointment.findByIdAndUpdate(
        appointmentId,
        { status: 'cancelled' },
        { new: true }
      );

      return {
        success: true,
        message: 'Cita cancelada',
        data: appointment
      };
    } catch (error) {
      console.error('❌ AppointmentService.cancelAppointment:', error);
      return { success: false, message: error.message };
    }
  }
}

export default new AppointmentService();
