import Quote from '../../models/Quote.js';
import Chatbot from '../../models/Chatbot.js';

export default class QuoteController {
  list = async (req, res) => {
    try {
      const { wsId, cbId } = req.params;
      const quotes = await Quote.find({
        workspaceId: wsId,
        chatbotId: cbId,
      }).sort({ createdAt: -1 });
      res.json({ success: true, data: quotes });
    } catch (error) {
      console.error('Error getting quotes:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  };

  patch = async (req, res) => {
    try {
      const { wsId, cbId, id } = req.params;
      const { status } = req.body;
      const quote = await Quote.findOneAndUpdate(
        { _id: id, workspaceId: wsId, chatbotId: cbId },
        { status },
        { new: true }
      );
      if (!quote) {
        return res.status(404).json({ success: false, message: 'Cotización no encontrada' });
      }
      res.json({ success: true, data: quote });
    } catch (error) {
      console.error('Error updating quote:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  };

  delete = async (req, res) => {
    try {
      const { wsId, cbId, id } = req.params;
      const quote = await Quote.findOneAndDelete({
        _id: id,
        workspaceId: wsId,
        chatbotId: cbId,
      });
      if (!quote) {
        return res.status(404).json({ success: false, message: 'Cotización no encontrada' });
      }
      res.json({ success: true, message: 'Cotización eliminada' });
    } catch (error) {
      console.error('Error deleting quote:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  };

  get = async (req, res) => {
    try {
      const { id } = req.params;
      const quote = await Quote.findById(id);
      if (!quote) {
        return res.status(404).json({ success: false, message: 'Cotización no encontrada' });
      }
      res.json({ success: true, data: quote });
    } catch (error) {
      console.error('Error getting quote:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  };

  update = async (req, res) => {
    try {
      const { id } = req.params;
      const quote = await Quote.findByIdAndUpdate(id, req.body, { new: true });
      if (!quote) {
        return res.status(404).json({ success: false, message: 'Cotización no encontrada' });
      }
      res.json({ success: true, data: quote });
    } catch (error) {
      console.error('Error updating quote:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  };

  resend = async (req, res) => {
    try {
      const { id } = req.params;
      const quote = await Quote.findById(id);
      if (!quote) {
        return res.status(404).json({ success: false, message: 'Cotización no encontrada' });
      }
      // TODO: Send quote email
      res.json({ success: true, message: 'Cotización reenviada' });
    } catch (error) {
      console.error('Error resending quote:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  };

  getPDF = async (req, res) => {
    try {
      const { id } = req.params;
      const quote = await Quote.findById(id);
      if (!quote) {
        return res.status(404).json({ success: false, message: 'Cotización no encontrada' });
      }
      // TODO: Generate and send PDF
      res.json({ success: true, message: 'PDF generado' });
    } catch (error) {
      console.error('Error getting quote PDF:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  };

  getShareLink = async (req, res) => {
    try {
      const { id } = req.params;
      const quote = await Quote.findById(id);
      if (!quote) {
        return res.status(404).json({ success: false, message: 'Cotización no encontrada' });
      }
      const shareLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/quotes/${quote._id}`;
      res.json({ success: true, data: { shareLink } });
    } catch (error) {
      console.error('Error getting share link:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  };

  getFields = async (req, res) => {
    try {
      const { cbId } = req.params;
      const chatbot = await Chatbot.findById(cbId).select('quoteFields');
      if (!chatbot) {
        return res.status(404).json({ success: false, message: 'Chatbot no encontrado' });
      }
      const fields = chatbot.quoteFields || [];
      res.json({ success: true, data: fields });
    } catch (error) {
      console.error('Error getting quote fields:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  };
}
