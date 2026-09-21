import mongoose from 'mongoose';

const joinRequestSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  studentFirebaseUid: {
    type: String,
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  studentEmail: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Ensure a student can only have one active request per project (e.g. they shouldn't spam requests if pending)
// We might not make a strict unique index on [projectId, studentFirebaseUid] because they might get rejected and try again later?
// Wait, the requirement says: "A student must not be able to create another pending request for the same project."
// We'll enforce this in the controller rather than a strict unique index, or a partial index. Controller enforcement is easier and allows rejected requests to be kept while a new one is made, or just blocks any duplicate request completely. The requirements say "Prevent duplicate active requests: A student must not be able to create another pending request for the same project."

const JoinRequest = mongoose.model('JoinRequest', joinRequestSchema);

export default JoinRequest;
