import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { connectDB } from './database.js';
import User from '../models/User.js';

dotenv.config();

const initializeDatabase = async () => {
  try {
    console.log('📦 Initializing database...');
    
    // Connect to MongoDB
    await connectDB();
    
    console.log('✅ Connected to MongoDB');
    
    // Create default admin user (password: admin123)
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const existingAdmin = await User.findOne({ email: 'admin@Assigno.com' });
    
    if (!existingAdmin) {
      await User.create({
        email: 'admin@Assigno.com',
        password: hashedPassword,
        fullName: 'System Admin',
        role: 'admin',
        studentId: 'ADMIN001'
      });
      console.log('✅ Default admin user created (email: admin@Assigno.com, password: admin123)');
    } else {
      console.log('ℹ️  Admin user already exists');
    }
    
    console.log('✅ Database initialization complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
};

initializeDatabase();
