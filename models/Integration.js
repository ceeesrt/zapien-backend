import mongoose from 'mongoose';
import { encrypt, decrypt } from '../utils/encryption.js';

const integrationSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true
    },
    chatbotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chatbot',
      required: true
    },
    type: {
      type: String,
      enum: ['shopify', 'jumpseller', 'woocommerce', 'custom_api'],
      required: true
    },
    credentials: {
      shopifyStore: String,
      accessToken: {
        type: String,
        set: (val) => val ? encrypt(val) : null,
        get: (val) => val ? decrypt(val) : null
      },
      jumpsellerId: String,
      apiKey: {
        type: String,
        set: (val) => val ? encrypt(val) : null,
        get: (val) => val ? decrypt(val) : null
      },
      apiSecret: {
        type: String,
        set: (val) => val ? encrypt(val) : null,
        get: (val) => val ? decrypt(val) : null
      },
      wcBaseUrl: String,
      wcConsumerKey: {
        type: String,
        set: (val) => val ? encrypt(val) : null,
        get: (val) => val ? decrypt(val) : null
      },
      wcConsumerSecret: {
        type: String,
        set: (val) => val ? encrypt(val) : null,
        get: (val) => val ? decrypt(val) : null
      },
      apiUrl: String,
      authHeader: {
        type: String,
        set: (val) => val ? encrypt(val) : null,
        get: (val) => val ? decrypt(val) : null
      }
    },
    syncConfig: {
      enabled: { type: Boolean, default: true },
      autoSyncInterval: { type: Number, default: 3600 },
      lastSyncAt: Date,
      nextSyncAt: Date,
      syncStatus: {
        type: String,
        enum: ['idle', 'syncing', 'success', 'failed'],
        default: 'idle'
      },
      lastSyncError: String,
      lastSyncProductCount: Number
    },
    webhookSecret: {
      type: String,
      set: (val) => val ? encrypt(val) : null,
      get: (val) => val ? decrypt(val) : null
    },
    connectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    connectedAt: { type: Date, default: Date.now },
    disconnectedAt: Date,
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

integrationSchema.index(
  { chatbotId: 1, isActive: 1 },
  { unique: true, sparse: true }
);

export default mongoose.model('Integration', integrationSchema);
