import mongoose from 'mongoose';

const productCacheSchema = new mongoose.Schema({
  chatbotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chatbot', required: true },
  externalId: { type: String, required: true },
  name: String,
  description: String,
  price: Number,
  currency: { type: String, default: 'CLP' },
  images: [String],
  stock: Number,
  category: String,
  attributes: Object,
  embedding: [Number],
  lastSyncedAt: { type: Date, default: Date.now }
});

productCacheSchema.index({ chatbotId: 1, externalId: 1 }, { unique: true });

export default mongoose.model('ProductCache', productCacheSchema);
