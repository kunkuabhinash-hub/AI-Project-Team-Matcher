import Team from '../models/Team.js';
import TeamMessage from '../models/TeamMessage.js';
import Student from '../models/Student.js';

// @desc    Get messages for a team
// @route   GET /api/teams/:teamId/messages
// @access  Private
export const getTeamMessages = async (req, res) => {
  try {
    const { teamId } = req.params;
    
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const student = await Student.findOne({ firebaseUid: req.user.uid });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Verify membership: user must be in memberStudentIds
    if (!team.memberStudentIds.includes(student._id)) {
      return res.status(403).json({ message: 'Not authorized to view messages for this team' });
    }

    const messages = await TeamMessage.find({ teamId })
      .sort({ createdAt: 1 })
      .lean();

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching team messages:', error);
    res.status(500).json({ message: 'Internal server error fetching team messages' });
  }
};

// @desc    Send a message to a team
// @route   POST /api/teams/:teamId/messages
// @access  Private
export const sendTeamMessage = async (req, res) => {
  try {
    const { teamId } = req.params;
    let { message } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ message: 'Message is required' });
    }
    
    message = message.trim();
    if (message.length === 0) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }
    
    if (message.length > 1000) {
      return res.status(400).json({ message: 'Message exceeds maximum length of 1000 characters' });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const student = await Student.findOne({ firebaseUid: req.user.uid });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Verify membership: user must be in memberStudentIds
    if (!team.memberStudentIds.includes(student._id)) {
      return res.status(403).json({ message: 'Not authorized to send messages to this team' });
    }

    const newMessage = await TeamMessage.create({
      teamId: team._id,
      projectId: team.projectId,
      senderStudentId: student._id,
      senderFirebaseUid: student.firebaseUid,
      senderName: student.fullName,
      message: message
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error sending team message:', error);
    res.status(500).json({ message: 'Internal server error sending team message' });
  }
};
