import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  ownerStudentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  memberStudentIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  }]
}, {
  timestamps: true
});

const Team = mongoose.model('Team', teamSchema);
export default Team;
