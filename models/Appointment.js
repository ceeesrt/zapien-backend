import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  chatbotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chatbot', required: true },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' },
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  scheduledAt: { type: Date, required: true },
  durationMinutes: Number,
  reason: String,
  customerName: String,
  customerEmail: String,
  customerPhone: String,
  notes: String,
  status: { type: String, enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'], default: 'scheduled' },
  calendarEventId: String,
  calendarEventUrl: String,
  reminderSent: { type: Boolean, default: false },
  externalId: String,
  createdAt: { type: Date, default: Date.now }
});

appointmentSchema.index({ workspaceId: 1, scheduledAt: 1 });
appointmentSchema.index({ chatbotId: 1, status: 1 });

export default mongoose.model('Appointment', appointmentSchema);
