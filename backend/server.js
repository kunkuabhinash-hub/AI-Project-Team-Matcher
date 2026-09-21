import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import profileRoutes from './routes/profileRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import joinRequestRoutes from './routes/joinRequestRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

// Load backend env vars
dotenv.config({ path: path.resolve(import.meta.dirname, '.env') });

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Vite default port (or 5174 depending on what's available)
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Backend API is running successfully',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/profile', profileRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/join-requests', joinRequestRoutes);
app.use('/api/ai', aiRoutes);

// Error Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
