import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { User } from '../models/index.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email: 'demo@zapien.cl' });

    if (existingUser) {
      console.log('✅ Usuario de prueba ya existe');
      process.exit(0);
    }

    // Crear usuario de prueba
    const passwordHash = await bcrypt.hash('Demo123!', 10);

    const user = new User({
      email: 'demo@zapien.cl',
      passwordHash,
      name: 'Demo User',
      emailVerified: true,
      avatar: 'D'
    });

    await user.save();
    console.log('✅ Usuario de prueba creado:');
    console.log(`   Email: demo@zapien.cl`);
    console.log(`   Contraseña: Demo123!`);
    console.log(`   Nombre: Demo User`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear usuario seed:', error);
    process.exit(1);
  }
};

seedDatabase();
