import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deviceInfo: String,
  expiresAt: { type: Date, required: true },
  revokedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

refreshTokenSchema.index({ token: 1 }, { unique: true });
refreshTokenSchema.index({ userId: 1 });
refreshTokenSchema.index({ revokedAt: 1, expiresAt: 1 });

export default mongoose.model('RefreshToken', refreshTokenSchema);
