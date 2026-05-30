import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  chatbotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chatbot', required: true },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  sku: { type: String, required: true },
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  currency: { type: String, default: 'CLP' },
  imageUrl: String,
  imagePath: String,
  stock: { type: Number, default: 0 },
  category: String,
  tags: [String],
  source: {
    type: String,
    enum: ['manual', 'csv', 'shopify', 'jumpseller', 'woocommerce', 'api'],
    default: 'manual'
  },
  sourceMetadata: {
    externalId: String,
    externalUrl: String,
    externalSku: String,
    lastSyncedAt: Date,
    syncStatus: {
      type: String,
      enum: ['synced', 'pending', 'failed'],
      default: 'pending'
    },
    syncError: String
  },
  manuallyUploaded: { type: Boolean, default: false },
  embedding: [Number],
  embeddingText: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

productSchema.index({ chatbotId: 1, sku: 1 }, { unique: true });
productSchema.index({ chatbotId: 1 });
productSchema.index({ embedding: 'cosmosSearch' }, { cosmosSearchOptions: { kind: 'vector-ivf', m: 4, efConstruction: 400, efSearch: 400, metric: 'cosine' } });

export default mongoose.model('Product', productSchema);
