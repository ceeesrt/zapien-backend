import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' },
  mercadoPagoPaymentId: { type: String, unique: true },
  amount: Number,
  currency: { type: String, default: 'CLP' },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'refunded'], default: 'pending' },
  paymentMethod: String,
  paidAt: Date,
  invoiceUrl: String,
  createdAt: { type: Date, default: Date.now }
});

paymentSchema.index({ workspaceId: 1, paidAt: -1 });
paymentSchema.index({ mercadoPagoPaymentId: 1 }, { unique: true });

export default mongoose.model('Payment', paymentSchema);
