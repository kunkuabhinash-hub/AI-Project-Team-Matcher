import mongoose from 'mongoose';

const teamMessageSchema = new mongoose.Schema({
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true,
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  senderStudentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  senderFirebaseUid: {
    type: String,
    required: true,
  },
  senderName: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000,
  }
}, {
  timestamps: true
});

const TeamMessage = mongoose.model('TeamMessage', teamMessageSchema);
export default TeamMessage;
