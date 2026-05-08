import IntegrationService from '../../services/integrations/integration.service.js';

const integrationService = new IntegrationService();

export default class IntegrationController {
    list = async (req, res) => {
        try {
            const { userId } = req.user;
            const response = await integrationService.listIntegrations(userId);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ IntegrationController.list:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al listar integraciones'
            });
        }
    };

    startGoogleCalendarOAuth = async (req, res) => {
        try {
            const { userId } = req.user;
            const response = await integrationService.startGoogleCalendarOAuth(userId);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ IntegrationController.startGoogleCalendarOAuth:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al iniciar OAuth'
            });
        }
    };

    handleGoogleCalendarCallback = async (req, res) => {
        try {
            const { userId } = req.user;
            const { code } = req.query;
            const response = await integrationService.handleGoogleCalendarCallback(userId, code);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ IntegrationController.handleGoogleCalendarCallback:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al procesar callback'
            });
        }
    };

    disconnect = async (req, res) => {
        try {
            const { userId } = req.user;
            const { id } = req.params;
            const response = await integrationService.disconnect(id, userId);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ IntegrationController.disconnect:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al desconectar'
            });
        }
    };
}
