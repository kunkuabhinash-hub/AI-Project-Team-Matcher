import mongoose from 'mongoose';

const teamInvitationSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  senderFirebaseUid: {
    type: String,
    required: true,
  },
  recipientFirebaseUid: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  }
}, {
  timestamps: true
});

const TeamInvitation = mongoose.model('TeamInvitation', teamInvitationSchema);
export default TeamInvitation;
