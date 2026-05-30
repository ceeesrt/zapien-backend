import mongoose from 'mongoose';
import Conversation from './models/Conversation.js';

const MONGODB_URI = 'mongodb+srv://lukas:lukas@cluster0.d8p0f.mongodb.net/zapien-db?retryWrites=true&w=majority';

async function checkConversations() {
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
    console.log('✅ Connected to MongoDB\n');

    const total = await Conversation.countDocuments();
    console.log(`📊 TOTAL conversaciones en BD: ${total}\n`);
    
    if (total > 0) {
      const samples = await Conversation.find().limit(5).sort({ createdAt: -1 });
      console.log(`📋 Últimas 5 conversaciones:\n`);
      samples.forEach((conv, idx) => {
        console.log(`${idx + 1}. ${conv.visitorId}`);
        console.log(`   └─ ${conv.messageCount} mensajes | Status: ${conv.status} | Outcome: ${conv.outcome}\n`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkConversations();
