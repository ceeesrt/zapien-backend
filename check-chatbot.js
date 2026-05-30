import mongoose from 'mongoose';

const mongoUri = 'mongodb+srv://cesarb:8IsUf1GqvUNDH3Ut@zapien.s6tdsld.mongodb.net/?appName=zapien';

mongoose.connect(mongoUri).then(async () => {
  const db = mongoose.connection.db;
  const collection = db.collection('chatbots');
  
  const bots = await collection.find({}).sort({ _id: -1 }).limit(3).toArray();
  
  console.log('\n📊 Latest 3 Chatbots:');
  bots.forEach((bot, idx) => {
    console.log(`\n  [${idx+1}] ${bot.name}`);
    console.log(`     ID: ${bot._id}`);
    console.log(`     OpenAI API Key: ${bot.openaiApiKey ? '✅' : '❌'}`);
    console.log(`     OpenAI Model: ${bot.openaiModel || '❌'}`);
    console.log(`     OpenAI Settings: ${bot.openaiSettings ? '✅' : '❌'}`);
  });
  
  mongoose.disconnect();
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
