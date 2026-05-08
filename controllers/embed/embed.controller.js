import EmbedService from '../../services/embed/embed.service.js';

const embedService = new EmbedService();

export default class EmbedController {
    startConversation = async (req, res) => {
        try {
            const { embedKey, visitorId } = req.body;
            const response = await embedService.startConversation(embedKey, visitorId);
            return res.status(response.success ? 201 : 400).json(response);
        } catch (error) {
            console.error('❌ EmbedController.startConversation:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al iniciar conversación'
            });
        }
    };

    sendMessage = async (req, res) => {
        try {
            const { conversationId, content } = req.body;
            const response = await embedService.sendMessage(conversationId, content);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ EmbedController.sendMessage:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al enviar mensaje'
            });
        }
    };

    captureLead = async (req, res) => {
        try {
            const { conversationId, ...leadData } = req.body;
            const response = await embedService.captureLead(conversationId, leadData);
            return res.status(response.success ? 201 : 400).json(response);
        } catch (error) {
            console.error('❌ EmbedController.captureLead:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al capturar lead'
            });
        }
    };

    requestQuote = async (req, res) => {
        try {
            const { conversationId, items } = req.body;
            const response = await embedService.requestQuote(conversationId, items);
            return res.status(response.success ? 201 : 400).json(response);
        } catch (error) {
            console.error('❌ EmbedController.requestQuote:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al solicitar cotización'
            });
        }
    };

    requestAppointment = async (req, res) => {
        try {
            const { conversationId, ...appointmentData } = req.body;
            const response = await embedService.requestAppointment(conversationId, appointmentData);
            return res.status(response.success ? 201 : 400).json(response);
        } catch (error) {
            console.error('❌ EmbedController.requestAppointment:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al agendar'
            });
        }
    };

    getAvailability = async (req, res) => {
        try {
            const { embedKey } = req.query;
            const response = await embedService.getAvailability(embedKey);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ EmbedController.getAvailability:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener disponibilidad'
            });
        }
    };

    searchProducts = async (req, res) => {
        try {
            const { embedKey, q } = req.query;
            const response = await embedService.searchProducts(embedKey, q);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ EmbedController.searchProducts:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al buscar productos'
            });
        }
    };
}
