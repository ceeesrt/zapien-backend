import Integration from '../../models/Integration.js';
import Chatbot from '../../models/Chatbot.js';
import Product from '../../models/Product.js';
import SyncHistory from '../../models/SyncHistory.js';
import ShopifyAdapter from './adapters/shopify.adapter.js';
import JumpsellerAdapter from './adapters/jumpseller.adapter.js';
import WooCommerceAdapter from './adapters/woocommerce.adapter.js';
import CustomApiAdapter from './adapters/custom-api.adapter.js';
import ShopifyWebhookService from './shopify-webhook.service.js';
import CurrencyService from '../currency/currency.service.js';

class IntegrationService {
  async testConnection(type, credentials) {
    try {
      const adapter = this.getAdapterForTest(type, credentials);
      const products = await adapter.fetchProducts();

      if (!Array.isArray(products)) {
        throw new Error('API did not return an array of products');
      }

      if (products.length === 0) {
        console.warn(`⚠️  Test connection returned 0 products`);
      } else {
        console.log(`✅ Test connection successful: ${products.length} products available`);
      }

      return { success: true, message: `Connection successful (${products.length} products found)` };
    } catch (error) {
      console.error(`❌ Test connection failed: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  getAdapterForTest(type, credentials) {
    switch (type) {
      case 'shopify':
        return new ShopifyAdapter(credentials);
      case 'jumpseller':
        return new JumpsellerAdapter(credentials);
      case 'woocommerce':
        return new WooCommerceAdapter(credentials);
      case 'custom_api':
        return new CustomApiAdapter(credentials);
      default:
        throw new Error(`Unsupported integration type: ${type}`);
    }
  }
  async connect(workspaceId, chatbotId, type, credentials, userId) {
    try {
      const chatbot = await Chatbot.findOne({ _id: chatbotId, workspaceId });
      if (!chatbot) {
        throw new Error('Chatbot not found or unauthorized');
      }

      await Integration.updateMany(
        { chatbotId, isActive: true },
        { isActive: false, disconnectedAt: new Date() }
      );

      const integration = new Integration({
        workspaceId,
        chatbotId,
        type,
        credentials,
        connectedBy: userId
      });

      await integration.save();

      await Chatbot.findByIdAndUpdate(chatbotId, {
        productLoadingMethod: type,
        activeIntegrationId: integration._id
      });

      if (type === 'shopify') {
        const webhookSecret = ShopifyWebhookService.generateWebhookSecret();
        integration.webhookSecret = webhookSecret;
        const webhookResults = await ShopifyWebhookService.registerWebhooks(
          credentials.shopifyStore,
          credentials.accessToken
        );
        console.log('🔗 Shopify webhook registration results:', webhookResults);
        await integration.save();
      }

      return { success: true, integration };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async disconnect(chatbotId) {
    try {
      const integration = await Integration.findOneAndUpdate(
        { chatbotId, isActive: true },
        { isActive: false, disconnectedAt: new Date() }
      );

      await Chatbot.findByIdAndUpdate(chatbotId, {
        productLoadingMethod: 'manual',
        activeIntegrationId: null
      });

      return { success: true, message: 'Integration disconnected' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async getActive(chatbotId) {
    return await Integration.findOne({ chatbotId, isActive: true }).select(
      '-credentials.accessToken -credentials.apiKey -credentials.apiSecret -credentials.wcConsumerSecret'
    );
  }

  async sync(integrationId, syncType = 'user-triggered') {
    const startTime = Date.now();
    let syncHistory = null;

    try {
      const integration = await Integration.findById(integrationId);
      if (!integration) {
        throw new Error('Integration not found');
      }

      integration.syncConfig.syncStatus = 'syncing';
      await integration.save();

      // Crear registro de sync
      syncHistory = new SyncHistory({
        integrationId,
        chatbotId: integration.chatbotId,
        workspaceId: integration.workspaceId,
        type: syncType,
        status: 'success'
      });

      const adapter = this.getAdapter(integration);
      const externalProducts = await adapter.fetchProducts();

      const result = await this.saveProductsWithConflictResolution(
        integration.workspaceId,
        integration.chatbotId,
        externalProducts,
        integration.type
      );

      // Limpiar productos antiguos (que no están en la fuente externa)
      const cleanupResult = await this.deleteOldProducts(
        integration.chatbotId,
        integration.type,
        result.externalSkus
      );

      integration.syncConfig.syncStatus = 'success';
      integration.syncConfig.lastSyncAt = new Date();
      integration.syncConfig.lastSyncProductCount = result.count;
      integration.syncConfig.lastSyncError = null;
      await integration.save();

      // Actualizar SyncHistory
      syncHistory.status = 'success';
      syncHistory.productsImported = result.count;
      syncHistory.productsUpdated = result.updated || 0;
      syncHistory.productsDeleted = cleanupResult.deleted || 0;
      syncHistory.duration = Date.now() - startTime;
      syncHistory.details = {
        newSkus: result.newSkus || [],
        updatedSkus: result.updatedSkus || [],
        deletedSkus: cleanupResult.deletedSkus || []
      };
      syncHistory.completedAt = new Date();
      await syncHistory.save();

      console.log(`✅ Sync completed: ${result.count} imported, ${cleanupResult.deleted} cleaned`);
      return { success: true, data: result, syncHistoryId: syncHistory._id };
    } catch (error) {
      console.error(`❌ Sync failed: ${error.message}`);

      // Actualizar Integration con error
      await Integration.findByIdAndUpdate(integrationId, {
        'syncConfig.syncStatus': 'failed',
        'syncConfig.lastSyncError': error.message
      });

      // Registrar error en SyncHistory
      if (syncHistory) {
        syncHistory.status = 'failed';
        syncHistory.error = error.message;
        syncHistory.duration = Date.now() - startTime;
        syncHistory.completedAt = new Date();
        await syncHistory.save();
      } else {
        const integration = await Integration.findById(integrationId);
        await SyncHistory.create({
          integrationId,
          chatbotId: integration.chatbotId,
          workspaceId: integration.workspaceId,
          type: syncType,
          status: 'failed',
          error: error.message,
          duration: Date.now() - startTime,
          completedAt: new Date()
        });
      }

      return { success: false, message: error.message };
    }
  }

  async deleteOldProducts(chatbotId, source, currentExternalSkus) {
    try {
      const existingProducts = await Product.find({ chatbotId, source });
      const skusToDelete = [];

      for (const product of existingProducts) {
        if (!currentExternalSkus.has(product.sku)) {
          skusToDelete.push(product.sku);
        }
      }

      if (skusToDelete.length > 0) {
        const result = await Product.deleteMany({
          chatbotId,
          source,
          sku: { $in: skusToDelete }
        });

        console.log(`🗑️  Deleted ${result.deletedCount} old products from ${source}`);
        return { deleted: result.deletedCount, deletedSkus: skusToDelete };
      }

      return { deleted: 0, deletedSkus: [] };
    } catch (error) {
      console.error('Error deleting old products:', error);
      return { deleted: 0, deletedSkus: [] };
    }
  }

  getAdapter(integration) {
    switch (integration.type) {
      case 'shopify':
        return new ShopifyAdapter(integration.credentials);
      case 'jumpseller':
        return new JumpsellerAdapter(integration.credentials);
      case 'woocommerce':
        return new WooCommerceAdapter(integration.credentials);
      case 'custom_api':
        return new CustomApiAdapter(integration.credentials);
      default:
        throw new Error(`Unsupported integration type: ${integration.type}`);
    }
  }

  async saveProductsWithConflictResolution(
    workspaceId,
    chatbotId,
    externalProducts,
    source
  ) {
    try {
      const existingManualProducts = await Product.find({
        chatbotId,
        source: { $in: ['manual', 'csv'] }
      });

      const existingBySku = new Map(
        existingManualProducts.map(p => [p.sku, p])
      );

      const productsToSave = [];
      const externalSkus = new Set();

      for (const extProduct of externalProducts) {
        externalSkus.add(extProduct.sku);

        // Normalize price to CLP if needed
        const normalizedPrice = await CurrencyService.normalizePrice(
          extProduct.price || 0,
          extProduct.currency || 'CLP'
        );

        const productData = {
          ...extProduct,
          price: normalizedPrice,
          currency: 'CLP',
          chatbotId,
          workspaceId,
          source,
          sourceMetadata: {
            externalId: extProduct.externalId,
            externalUrl: extProduct.externalUrl,
            lastSyncedAt: new Date(),
            syncStatus: 'synced'
          }
        };

        if (existingBySku.has(extProduct.sku)) {
          if (source === 'shopify') {
            productsToSave.push(productData);
          }
        } else {
          productsToSave.push(productData);
        }
      }

      if (productsToSave.length === 0) {
        return { count: 0, upsertedCount: 0, modifiedCount: 0, externalSkus };
      }

      const result = await Product.bulkWrite(
        productsToSave.map(p => ({
          updateOne: {
            filter: { chatbotId, sku: p.sku },
            update: { $set: p },
            upsert: true
          }
        }))
      );

      return {
        count: productsToSave.length,
        upsertedCount: result.upsertedCount,
        modifiedCount: result.modifiedCount,
        externalSkus,
        newSkus: Array.from(externalSkus),
        updated: result.modifiedCount,
        updatedSkus: []
      };
    } catch (error) {
      throw error;
    }
  }
}

export default new IntegrationService();
