import mongoose from 'mongoose';

const mongoUri = 'mongodb+srv://cesarb:8IsUf1GqvUNDH3Ut@zapien.s6tdsld.mongodb.net/?appName=zapien';

mongoose.connect(mongoUri).then(async () => {
  const db = mongoose.connection.db;
  const collection = db.collection('chatbots');
  
  const bot = await collection.findOne({ _id: mongoose.Types.ObjectId.createFromHexString('6a14bc19b9b34ac019fc8563') });
  
  console.log('\n📊 Chatbot 6a14bc19b9b34ac019fc8563:');
  console.log(JSON.stringify(bot, null, 2));
  
  mongoose.disconnect();
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
