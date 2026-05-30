import mongoose from 'mongoose';

const companyInfoSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    company: {
      name: String,
      address: String,
      city: String,
      country: String,
      phone: String,
      email: String,
      website: String
    },
    hours: [
      {
        day: String,
        open: String,
        close: String,
        isClosed: Boolean
      }
    ],
    hoursDisplay: [String],
    dispatches: {
      available: Boolean,
      specialCases: String
    },
    payments: {
      creditCard: Boolean,
      transfer: Boolean,
      paypal: Boolean,
      cash: Boolean,
      webpay: Boolean,
      flow: Boolean,
      mercadopago: Boolean,
      maquinaPos: Boolean
    },
    social: {
      instagram: String,
      whatsapp: String,
      facebook: String,
      tiktok: String,
      linkedin: String,
      youtube: String,
      twitter: String,
      telegram: String,
      wechat: String,
      viber: String,
      line: String,
      messenger: String
    }
  },
  { timestamps: true }
);

export default mongoose.model('CompanyInfo', companyInfoSchema);
