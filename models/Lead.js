import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
  chatbotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chatbot', required: true },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' },

  name: String,
  email: String,
  phone: String,
  company: String,
  intent: String,
  notes: String,

  status: { type: String, enum: ['new', 'contacted', 'qualified', 'won', 'lost'], default: 'new' },

  // Conversion tracking
  quoteIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Quote' }],
  appointmentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' }],

  // Timeline tracking
  statusHistory: [{
    status: String,
    changedAt: { type: Date, default: Date.now },
    changedBy: String
  }],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

leadSchema.index({ workspaceId: 1, createdAt: -1 });
leadSchema.index({ chatbotId: 1, status: 1 });
leadSchema.index({ chatbotId: 1, createdAt: -1 });
leadSchema.index({ email: 1, chatbotId: 1 });

export default mongoose.model('Lead', leadSchema);
