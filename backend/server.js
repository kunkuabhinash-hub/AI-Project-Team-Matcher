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
import teamRoutes from './routes/teamRoutes.js';
import invitationRoutes from './routes/invitationRoutes.js';
import teamChatRoutes from './routes/teamChatRoutes.js';
import myTeamsRoutes from './routes/myTeamsRoutes.js';
import http from 'http';
import { Server } from 'socket.io';
import { setupSocket } from './socket.js';

// Load backend env vars
dotenv.config({ path: path.resolve(import.meta.dirname, '.env') });

// Connect to MongoDB
connectDB();

const app = express();
const httpServer = http.createServer(app);

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Vite default port (or 5174 depending on what's available)
  credentials: true
};

const io = new Server(httpServer, {
  cors: corsOptions
});

setupSocket(io);

// Middleware
app.use(cors(corsOptions));
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
app.use('/api/projects', teamRoutes);
app.use('/api/join-requests', joinRequestRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api', invitationRoutes);
app.use('/api/teams', teamChatRoutes);
app.use('/api/my-teams', myTeamsRoutes);

// Error Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
