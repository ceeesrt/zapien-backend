import mongoose from 'mongoose';

const chatbotConfigSchema = new mongoose.Schema(
  {
    chatbotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chatbot',
      required: true,
      unique: true
    },
    instructions: {
      tone: {
        type: String,
        enum: ['formal', 'amigable', 'casual', 'custom'],
        default: 'amigable'
      },
      customToneDescription: String,
      additionalContext: String,
      maxProducts: { type: Number, default: 5 },
      maxDiscount: { type: Number, default: 20 },
      maxChars: { type: Number, default: 500 },
      mustDo: {
        mentionHours: { type: Boolean, default: true },
        suggestPayment: { type: Boolean, default: true },
        includeSources: { type: Boolean, default: true }
      },
      mustNotDo: {
        inventInfo: { type: Boolean, default: true },
        mentionCompetitors: { type: Boolean, default: true }
      },
      closingQuestion: {
        type: String,
        default: '¿En qué más puedo ayudarte?'
      },
      mustInclude: {
        sources: { type: Boolean, default: true },
        hours: { type: Boolean, default: true },
        payments: { type: Boolean, default: true },
        dispatch: { type: Boolean, default: true }
      }
    }
  },
  { timestamps: true }
);

export default mongoose.model('ChatbotConfig', chatbotConfigSchema);
