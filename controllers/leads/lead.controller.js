import Lead from '../../models/Lead.js';
import Quote from '../../models/Quote.js';
import Appointment from '../../models/Appointment.js';

export default class LeadController {
  list = async (req, res) => {
    try {
      const { wsId, cbId } = req.params;
      const { status, hasQuote, hasAppointment, search, startDate, endDate } = req.query;

      let query = { workspaceId: wsId, chatbotId: cbId };

      if (status) query.status = status;
      if (search) query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      let leads = await Lead.find(query).sort({ createdAt: -1 });

      if (hasQuote === 'true') leads = leads.filter(l => l.quoteIds?.length > 0);
      if (hasQuote === 'false') leads = leads.filter(l => !l.quoteIds || l.quoteIds.length === 0);
      if (hasAppointment === 'true') leads = leads.filter(l => l.appointmentIds?.length > 0);
      if (hasAppointment === 'false') leads = leads.filter(l => !l.appointmentIds || l.appointmentIds.length === 0);

      res.json({ success: true, data: leads });
    } catch (error) {
      console.error('Error getting leads:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  };

  delete = async (req, res) => {
    try {
      const { wsId, cbId, id } = req.params;
      const lead = await Lead.findOneAndDelete({
        _id: id,
        workspaceId: wsId,
        chatbotId: cbId,
      });
      if (!lead) {
        return res.status(404).json({ success: false, message: 'Lead no encontrado' });
      }
      res.json({ success: true, message: 'Lead eliminado' });
    } catch (error) {
      console.error('Error deleting lead:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  };

  get = async (req, res) => {
    try {
      const { wsId, cbId, id } = req.params;
      const lead = await Lead.findOne({
        _id: id,
        workspaceId: wsId,
        chatbotId: cbId,
      });
      if (!lead) {
        return res.status(404).json({ success: false, message: 'Lead no encontrado' });
      }

      const quotes = await Quote.find({ _id: { $in: lead.quoteIds || [] } });
      const appointments = await Appointment.find({ _id: { $in: lead.appointmentIds || [] } });

      res.json({ success: true, data: { ...lead.toObject(), quotes, appointments } });
    } catch (error) {
      console.error('Error getting lead:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  };

  funnel = async (req, res) => {
    try {
      const { wsId, cbId } = req.params;

      const counts = await Lead.aggregate([
        { $match: { workspaceId: wsId, chatbotId: cbId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);

      const statusMap = {
        new: 0,
        contacted: 0,
        qualified: 0,
        won: 0,
        lost: 0
      };

      counts.forEach(item => {
        if (statusMap.hasOwnProperty(item._id)) {
          statusMap[item._id] = item.count;
        }
      });

      const total = Object.values(statusMap).reduce((a, b) => a + b, 0);

      res.json({
        success: true,
        data: {
          total,
          byStatus: statusMap,
          conversions: {
            newToContacted: total > 0 ? Math.round((statusMap.contacted / total) * 100) : 0,
            contactedToQualified: statusMap.contacted > 0 ? Math.round((statusMap.qualified / statusMap.contacted) * 100) : 0,
            qualifiedToWon: statusMap.qualified > 0 ? Math.round((statusMap.won / statusMap.qualified) * 100) : 0,
            winRate: total > 0 ? Math.round((statusMap.won / total) * 100) : 0
          }
        }
      });
    } catch (error) {
      console.error('Error getting funnel stats:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  };

  update = async (req, res) => {
    try {
      const { wsId, cbId, id } = req.params;
      const { status, ...otherUpdates } = req.body;

      let updateOps = { ...otherUpdates };

      if (status) {
        updateOps.status = status;
        updateOps.$push = {
          statusHistory: {
            status,
            changedAt: new Date(),
            changedBy: req.user?.id || 'system'
          }
        };
      }

      const lead = await Lead.findOneAndUpdate(
        { _id: id, workspaceId: wsId, chatbotId: cbId },
        updateOps,
        { new: true }
      );
      if (!lead) {
        return res.status(404).json({ success: false, message: 'Lead no encontrado' });
      }
      res.json({ success: true, data: lead });
    } catch (error) {
      console.error('Error updating lead:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  };

  export = async (req, res) => {
    try {
      const { wsId, cbId } = req.params;
      const leads = await Lead.find({
        workspaceId: wsId,
        chatbotId: cbId,
      });
      const csv = 'ID,Name,Email,Phone,Company,Message,Created\n' +
        leads.map(l => `${l._id},${l.name},${l.email},${l.phone},${l.company},"${l.message}",${l.createdAt}`).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="leads.csv"');
      res.send(csv);
    } catch (error) {
      console.error('Error exporting leads:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  };
}
