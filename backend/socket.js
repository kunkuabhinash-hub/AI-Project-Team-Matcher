import { getAuth } from 'firebase-admin/auth';
import Team from './models/Team.js';
import Student from './models/Student.js';
import TeamMessage from './models/TeamMessage.js';

export const setupSocket = (io) => {
  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }
      
      // Verify token using Firebase Admin
      const decodedToken = await getAuth().verifyIdToken(token);
      socket.user = decodedToken;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    
    // JOIN TEAM
    socket.on('join-team', async (payload, callback) => {
      try {
        if (!payload || !payload.teamId) {
          socket.emit('chat-error', { message: 'Team ID is required' });
          if (callback) callback({ error: 'Team ID is required' });
          return;
        }
        
        const { teamId } = payload;
        
        // Find team
        const team = await Team.findById(teamId);
        if (!team) {
          socket.emit('chat-error', { message: 'Team not found' });
          if (callback) callback({ error: 'Team not found' });
          return;
        }

        // Find student
        const student = await Student.findOne({ firebaseUid: socket.user.uid });
        if (!student) {
          socket.emit('chat-error', { message: 'Student profile not found' });
          if (callback) callback({ error: 'Student profile not found' });
          return;
        }

        // Verify membership
        if (!team.memberStudentIds.includes(student._id)) {
          socket.emit('chat-error', { message: 'Not authorized to join this team chat' });
          if (callback) callback({ error: 'Not authorized' });
          return;
        }

        // Join room
        socket.join(teamId);
        if (callback) callback({ success: true, message: `Joined team room ${teamId}` });
      } catch (error) {
        console.error('Socket join-team error:', error);
        socket.emit('chat-error', { message: 'Internal server error joining team' });
        if (callback) callback({ error: 'Internal server error' });
      }
    });

    // SEND MESSAGE
    socket.on('send-team-message', async (payload) => {
      try {
        if (!payload || !payload.teamId || !payload.message) {
          socket.emit('chat-error', { message: 'Team ID and message are required' });
          return;
        }

        let { teamId, message } = payload;
        
        message = message.trim();
        if (message.length === 0) {
          socket.emit('chat-error', { message: 'Message cannot be empty' });
          return;
        }
        
        if (message.length > 1000) {
          socket.emit('chat-error', { message: 'Message exceeds maximum length of 1000 characters' });
          return;
        }

        // Verify team and membership again
        const team = await Team.findById(teamId);
        if (!team) {
          socket.emit('chat-error', { message: 'Team not found' });
          return;
        }

        const student = await Student.findOne({ firebaseUid: socket.user.uid });
        if (!student || !team.memberStudentIds.includes(student._id)) {
          socket.emit('chat-error', { message: 'Not authorized to send messages to this team' });
          return;
        }

        // Create message in MongoDB
        const newMessage = await TeamMessage.create({
          teamId: team._id,
          projectId: team.projectId,
          senderStudentId: student._id,
          senderFirebaseUid: student.firebaseUid,
          senderName: student.fullName,
          message: message
        });

        // Broadcast to room
        io.to(teamId).emit('new-team-message', newMessage);

      } catch (error) {
        console.error('Socket send-team-message error:', error);
        socket.emit('chat-error', { message: 'Internal server error sending message' });
      }
    });

    socket.on('disconnect', () => {
      // Clean up if needed
    });
  });
};
