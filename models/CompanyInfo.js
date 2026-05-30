import mongoose from 'mongoose';

const companyInfoSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      unique: true
    },
    company: {
      name: {
        type: String,
        required: true
      },
      address: {
        type: String,
        required: true
      },
      city: String,
      region: String,
      phone: {
        type: String,
        required: true
      },
      email: {
        type: String,
        required: true
      },
      website: String,
      rut: String
    },
    hours: {
      mondayFriday: {
        open: { type: String, default: '09:00' },
        close: { type: String, default: '18:00' }
      },
      saturday: {
        open: { type: String, default: '10:00' },
        close: { type: String, default: '15:00' }
      },
      sundayClosed: { type: Boolean, default: true }
    },
    dispatches: {
      santiago: { type: Boolean, default: true },
      valparaiso: { type: Boolean, default: true },
      concepcion: { type: Boolean, default: true },
      arica: { type: Boolean, default: false }
    },
    payments: {
      creditCard: { type: Boolean, default: true },
      transfer: { type: Boolean, default: true },
      paypal: { type: Boolean, default: true },
      cash: { type: Boolean, default: true }
    },
    social: {
      instagram: String,
      whatsapp: String,
      facebook: String,
      tiktok: String
    }
  },
  { timestamps: true }
);

export default mongoose.model('CompanyInfo', companyInfoSchema);
