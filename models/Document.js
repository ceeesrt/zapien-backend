import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  chatbotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chatbot', required: true },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  filename: { type: String, required: true },
  mimeType: String,
  sizeBytes: Number,
  localUrl: String,
  cloudinaryUrl: String,
  cloudinaryPublicId: String,
  status: { type: String, enum: ['uploading', 'processing', 'ready', 'failed'], default: 'uploading' },
  totalChunks: Number,
  errorMessage: String,
  processedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

documentSchema.index({ chatbotId: 1 });
documentSchema.index({ status: 1 });

export default mongoose.model('Document', documentSchema);
