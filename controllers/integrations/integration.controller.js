import IntegrationService from '../../services/integrations/integration.service.js';
import { enqueueIntegrationSync } from '../../services/queue/sync-processor.js';
import SyncHistory from '../../models/SyncHistory.js';

class IntegrationController {
  async getActive(req, res) {
    try {
      const { workspaceId, chatbotId } = req.params;

      const integration = await IntegrationService.getActive(chatbotId);
      if (!integration) {
        return res.status(404).json({ success: false, message: 'No active integration' });
      }

      return res.status(200).json({ success: true, data: integration });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async connect(req, res) {
    try {
      const { workspaceId, chatbotId } = req.params;
      const { type, credentials } = req.body;

      if (!type || !credentials) {
        return res.status(400).json({ success: false, message: 'Missing required fields: type, credentials' });
      }

      const result = await IntegrationService.connect(workspaceId, chatbotId, type, credentials, req.user._id);
      return res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async disconnect(req, res) {
    try {
      const { chatbotId } = req.params;
      const result = await IntegrationService.disconnect(chatbotId);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async sync(req, res) {
    try {
      const { integrationId } = req.params;

      const job = await enqueueIntegrationSync(integrationId);
      return res.status(202).json({
        success: true,
        message: 'Sync job queued',
        jobId: job.id
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getStatus(req, res) {
    try {
      const { integrationId } = req.params;

      const lastSync = await SyncHistory.findOne({ integrationId })
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        data: lastSync || { message: 'No sync history' }
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getHistory(req, res) {
    try {
      const { integrationId } = req.params;
      const { limit = 10 } = req.query;

      const history = await SyncHistory.find({ integrationId })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));

      return res.status(200).json({
        success: true,
        data: history
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async testConnection(req, res) {
    try {
      const { type, credentials } = req.body;

      if (!type || !credentials) {
        return res.status(400).json({ success: false, message: 'Missing type or credentials' });
      }

      const result = await IntegrationService.testConnection(type, credentials);
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new IntegrationController();
