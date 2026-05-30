import mongoose from 'mongoose';

const syncHistorySchema = new mongoose.Schema({
  integrationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Integration',
    required: true
  },
  chatbotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chatbot',
    required: true
  },
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  type: {
    type: String,
    enum: ['manual', 'scheduled', 'webhook', 'user-triggered'],
    default: 'user-triggered'
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'partial'],
    default: 'success'
  },
  productsImported: { type: Number, default: 0 },
  productsUpdated: { type: Number, default: 0 },
  productsDeleted: { type: Number, default: 0 },
  duration: { type: Number }, // milliseconds
  error: String,
  details: {
    newSkus: [String],
    updatedSkus: [String],
    deletedSkus: [String],
    conflicts: [{
      sku: String,
      external: String,
      local: String,
      resolution: String
    }]
  },
  startedAt: { type: Date, default: Date.now },
  completedAt: Date
});

syncHistorySchema.index({ integrationId: 1, createdAt: -1 });
syncHistorySchema.index({ chatbotId: 1, createdAt: -1 });
syncHistorySchema.index({ workspaceId: 1, createdAt: -1 });
syncHistorySchema.index({ status: 1 });

export default mongoose.model('SyncHistory', syncHistorySchema);
