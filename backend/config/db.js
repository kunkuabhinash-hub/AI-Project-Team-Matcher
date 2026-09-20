import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load backend env vars
dotenv.config({ path: path.resolve(import.meta.dirname, '../.env') });

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.warn('⚠️  MONGO_URI is not defined. Skipping MongoDB connection.');
      return;
    }

    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Don't exit process in dev if DB is missing just yet, but typically process.exit(1)
  }
};

export default connectDB;
