import ChatbotService from '../../services/chatbots/chatbot.service.js';

const chatbotService = new ChatbotService();

export default class ChatbotController {
    list = async (req, res) => {
        try {
            const { workspaceId } = req.params;
            const response = await chatbotService.list(workspaceId);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ ChatbotController.list:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al listar chatbots'
            });
        }
    };

    create = async (req, res) => {
        try {
            const { workspaceId } = req.params;
            const { name, industry } = req.body;
            const response = await chatbotService.create(workspaceId, name, industry);
            return res.status(response.success ? 201 : 400).json(response);
        } catch (error) {
            console.error('❌ ChatbotController.create:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al crear chatbot'
            });
        }
    };

    get = async (req, res) => {
        try {
            const { id } = req.params;
            const response = await chatbotService.get(id);
            return res.status(response.success ? 200 : 404).json(response);
        } catch (error) {
            console.error('❌ ChatbotController.get:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener chatbot'
            });
        }
    };

    update = async (req, res) => {
        try {
            const { id } = req.params;
            const response = await chatbotService.update(id, req.body);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ ChatbotController.update:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al actualizar chatbot'
            });
        }
    };

    delete = async (req, res) => {
        try {
            const { id } = req.params;
            const response = await chatbotService.delete(id);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ ChatbotController.delete:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al eliminar chatbot'
            });
        }
    };

    activate = async (req, res) => {
        try {
            const { id } = req.params;
            const response = await chatbotService.activate(id);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ ChatbotController.activate:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al activar chatbot'
            });
        }
    };

    pause = async (req, res) => {
        try {
            const { id } = req.params;
            const response = await chatbotService.pause(id);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ ChatbotController.pause:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al pausar chatbot'
            });
        }
    };

    getEmbedCode = async (req, res) => {
        try {
            const { id } = req.params;
            const response = await chatbotService.getEmbedCode(id);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ ChatbotController.getEmbedCode:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener embed code'
            });
        }
    };

    getStats = async (req, res) => {
        try {
            const { id } = req.params;
            const response = await chatbotService.getStats(id);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ ChatbotController.getStats:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener stats'
            });
        }
    };
}
