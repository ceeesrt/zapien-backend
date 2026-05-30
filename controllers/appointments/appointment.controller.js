import Appointment from '../../models/Appointment.js';

export default class AppointmentController {
  list = async (req, res) => {
    try {
      const { wsId, cbId } = req.params;
      const appointments = await Appointment.find({
        workspaceId: wsId,
        chatbotId: cbId,
      }).sort({ scheduledAt: -1 });
      res.json({ success: true, data: appointments });
    } catch (error) {
      console.error('Error getting appointments:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  };

  patch = async (req, res) => {
    try {
      const { wsId, cbId, id } = req.params;
      const { status } = req.body;
      const appointment = await Appointment.findOneAndUpdate(
        { _id: id, workspaceId: wsId, chatbotId: cbId },
        { status },
        { new: true }
      );
      if (!appointment) {
        return res.status(404).json({ success: false, message: 'Cita no encontrada' });
      }
      res.json({ success: true, data: appointment });
    } catch (error) {
      console.error('Error updating appointment:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  };

  delete = async (req, res) => {
    try {
      const { wsId, cbId, id } = req.params;
      const appointment = await Appointment.findOneAndDelete({
        _id: id,
        workspaceId: wsId,
        chatbotId: cbId,
      });
      if (!appointment) {
        return res.status(404).json({ success: false, message: 'Cita no encontrada' });
      }
      res.json({ success: true, message: 'Cita eliminada' });
    } catch (error) {
      console.error('Error deleting appointment:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  };

  get = async (req, res) => {
    try {
      const { id } = req.params;
      const appointment = await Appointment.findById(id);
      if (!appointment) {
        return res.status(404).json({ success: false, message: 'Cita no encontrada' });
      }
      res.json({ success: true, data: appointment });
    } catch (error) {
      console.error('Error getting appointment:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  };

  updateStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const appointment = await Appointment.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );
      if (!appointment) {
        return res.status(404).json({ success: false, message: 'Cita no encontrada' });
      }
      res.json({ success: true, data: appointment });
    } catch (error) {
      console.error('Error updating appointment status:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  };

  reschedule = async (req, res) => {
    try {
      const { id } = req.params;
      const { scheduledAt } = req.body;
      const appointment = await Appointment.findByIdAndUpdate(
        id,
        { scheduledAt },
        { new: true }
      );
      if (!appointment) {
        return res.status(404).json({ success: false, message: 'Cita no encontrada' });
      }
      res.json({ success: true, data: appointment, message: 'Cita reprogramada' });
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  };

  sendReminder = async (req, res) => {
    try {
      const { id } = req.params;
      const appointment = await Appointment.findById(id);
      if (!appointment) {
        return res.status(404).json({ success: false, message: 'Cita no encontrada' });
      }
      // TODO: Send reminder email/SMS
      res.json({ success: true, message: 'Recordatorio enviado' });
    } catch (error) {
      console.error('Error sending reminder:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  };
}
