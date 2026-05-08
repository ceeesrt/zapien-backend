import QuoteService from '../../services/quotes/quote.service.js';

const quoteService = new QuoteService();

export default class QuoteController {
    list = async (req, res) => {
        try {
            const { workspaceId } = req.params;
            const { status, startDate, endDate, search } = req.query;
            const filters = { status, startDate, endDate, search };
            const response = await quoteService.list(workspaceId, filters);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ QuoteController.list:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al listar cotizaciones'
            });
        }
    };

    get = async (req, res) => {
        try {
            const { id } = req.params;
            const response = await quoteService.get(id);
            return res.status(response.success ? 200 : 404).json(response);
        } catch (error) {
            console.error('❌ QuoteController.get:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener cotización'
            });
        }
    };

    update = async (req, res) => {
        try {
            const { id } = req.params;
            const response = await quoteService.update(id, req.body);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ QuoteController.update:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al actualizar cotización'
            });
        }
    };

    resend = async (req, res) => {
        try {
            const { id } = req.params;
            const response = await quoteService.resend(id);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ QuoteController.resend:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al reenviar'
            });
        }
    };

    getPDF = async (req, res) => {
        try {
            const { id } = req.params;
            const response = await quoteService.getPDF(id);
            return res.status(response.success ? 200 : 404).json(response);
        } catch (error) {
            console.error('❌ QuoteController.getPDF:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener PDF'
            });
        }
    };

    getShareLink = async (req, res) => {
        try {
            const { id } = req.params;
            const response = await quoteService.getShareLink(id);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ QuoteController.getShareLink:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al generar link'
            });
        }
    };
}
