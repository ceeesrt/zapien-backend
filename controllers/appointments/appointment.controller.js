import AppointmentService from '../../services/appointments/appointment.service.js';

const appointmentService = new AppointmentService();

export default class AppointmentController {
    list = async (req, res) => {
        try {
            const { workspaceId } = req.params;
            const { status, startDate, endDate, view } = req.query;
            const filters = { status, startDate, endDate, view };
            const response = await appointmentService.list(workspaceId, filters);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ AppointmentController.list:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al listar citas'
            });
        }
    };

    get = async (req, res) => {
        try {
            const { id } = req.params;
            const response = await appointmentService.get(id);
            return res.status(response.success ? 200 : 404).json(response);
        } catch (error) {
            console.error('❌ AppointmentController.get:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener cita'
            });
        }
    };

    updateStatus = async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const response = await appointmentService.updateStatus(id, status);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ AppointmentController.updateStatus:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al actualizar estado'
            });
        }
    };

    reschedule = async (req, res) => {
        try {
            const { id } = req.params;
            const { scheduledAt } = req.body;
            const response = await appointmentService.reschedule(id, scheduledAt);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ AppointmentController.reschedule:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al reagendar'
            });
        }
    };

    sendReminder = async (req, res) => {
        try {
            const { id } = req.params;
            const response = await appointmentService.sendReminder(id);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ AppointmentController.sendReminder:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al enviar recordatorio'
            });
        }
    };
}
