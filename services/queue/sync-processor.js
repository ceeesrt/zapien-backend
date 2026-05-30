import { integrationSyncQueue } from './queue.service.js';
import Integration from '../../models/Integration.js';
import IntegrationService from '../integrations/integration.service.js';

export const processSyncQueue = () => {
  integrationSyncQueue.process(async (job) => {
    const { integrationId } = job.data;

    console.log(`🔄 Processing sync for integration ${integrationId}`);

    try {
      const integration = await Integration.findById(integrationId);
      if (!integration || !integration.isActive) {
        throw new Error('Integration not found or inactive');
      }

      const result = await IntegrationService.sync(integrationId);

      if (result.success) {
        console.log(`✅ Sync completed: ${result.data.count} products`);
        return result.data;
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error(`❌ Sync failed:`, error.message);
      throw error;
    }
  });
};

export const enqueueIntegrationSync = async (integrationId, delay = 0) => {
  try {
    const job = await integrationSyncQueue.add(
      { integrationId },
      {
        delay,
        jobId: `sync-${integrationId}-${Date.now()}`,
      }
    );
    console.log(`📋 Sync job enqueued: ${job.id}`);
    return job;
  } catch (error) {
    console.error('Error enqueuing sync job:', error);
    throw error;
  }
};

export const schedulePeriodicSync = async () => {
  try {
    const activeIntegrations = await Integration.find({ isActive: true });

    for (const integration of activeIntegrations) {
      if (integration.syncConfig.enabled) {
        const lastSync = integration.syncConfig.lastSyncAt || new Date(0);
        const timeSinceSync = Date.now() - lastSync.getTime();
        const syncInterval = (integration.syncConfig.autoSyncInterval || 3600) * 1000;

        if (timeSinceSync >= syncInterval) {
          await enqueueIntegrationSync(integration._id);
        }
      }
    }
  } catch (error) {
    console.error('Error scheduling periodic sync:', error);
  }
};
