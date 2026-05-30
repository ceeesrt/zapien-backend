import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const mongoUri = process.env.MONGODB_URI;
console.log(`Connecting to MongoDB: ${mongoUri.split('@')[1] || mongoUri.substring(0, 50)}...`);

mongoose.connect(mongoUri).then(async () => {
  const db = mongoose.connection.db;
  const collection = db.collection('chatbots');
  
  // Get the last created chatbot
  const bots = await collection.find({}).sort({ _id: -1 }).limit(1).toArray();
  
  if (bots.length > 0) {
    const bot = bots[0];
    console.log('\n📊 Latest Chatbot:');
    console.log(`  Name: ${bot.name}`);
    console.log(`  ID: ${bot._id}`);
    console.log(`  OpenAI API Key: ${bot.openaiApiKey ? '✅ (present)' : '❌ (missing)'}`);
    console.log(`  OpenAI Model: ${bot.openaiModel || '❌ (missing)'}`);
    console.log(`  OpenAI Settings:`, bot.openaiSettings || '❌ (missing)');
    console.log('\nFull document:');
    console.log(JSON.stringify(bot, null, 2));
  } else {
    console.log('No chatbots found');
  }
  
  mongoose.disconnect();
}).catch(err => {
  console.error('Connection error:', err);
  process.exit(1);
});
