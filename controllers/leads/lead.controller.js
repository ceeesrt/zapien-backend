import LeadService from '../../services/leads/lead.service.js';

const leadService = new LeadService();

export default class LeadController {
    list = async (req, res) => {
        try {
            const { workspaceId } = req.params;
            const { status, startDate, endDate, search } = req.query;
            const filters = { status, startDate, endDate, search };
            const response = await leadService.list(workspaceId, filters);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ LeadController.list:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al listar leads'
            });
        }
    };

    get = async (req, res) => {
        try {
            const { id } = req.params;
            const response = await leadService.get(id);
            return res.status(response.success ? 200 : 404).json(response);
        } catch (error) {
            console.error('❌ LeadController.get:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener lead'
            });
        }
    };

    update = async (req, res) => {
        try {
            const { id } = req.params;
            const response = await leadService.update(id, req.body);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ LeadController.update:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al actualizar lead'
            });
        }
    };

    delete = async (req, res) => {
        try {
            const { id } = req.params;
            const response = await leadService.delete(id);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ LeadController.delete:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al eliminar lead'
            });
        }
    };

    export = async (req, res) => {
        try {
            const { workspaceId } = req.params;
            const { status, startDate, endDate } = req.query;
            const filters = { status, startDate, endDate };
            const response = await leadService.export(workspaceId, filters);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ LeadController.export:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al exportar leads'
            });
        }
    };
}
