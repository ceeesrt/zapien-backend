import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  chatbotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chatbot', required: true },
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, required: true },

  metadata: {
    ragChunksUsed: [mongoose.Schema.Types.ObjectId],
    productsReferenced: [String],
    tokensIn: Number,
    tokensOut: Number,
    model: String,
    latencyMs: Number,
    cost: Number
  },

  createdAt: { type: Date, default: Date.now }
});

messageSchema.index({ conversationId: 1, createdAt: 1 });

export default mongoose.model('Message', messageSchema);
