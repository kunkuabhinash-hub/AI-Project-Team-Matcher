import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Project title is required']
  },
  description: {
    type: String,
    required: [true, 'Project description is required']
  },
  requiredSkills: {
    type: [String],
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'At least one required skill is needed'
    }
  },
  category: {
    type: String,
    required: [true, 'Category is required']
  },
  teamSize: {
    type: Number,
    required: [true, 'Team size is required'],
    min: [1, 'Team size must be at least 1']
  },
  duration: {
    type: String,
    default: 'Not specified'
  },
  creatorFirebaseUid: {
    type: String,
    required: true
  },
  creatorName: {
    type: String,
    default: 'Unknown User'
  },
  creatorEmail: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Planning', 'Team Forming', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Planning'
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

const Project = mongoose.model('Project', projectSchema);

export default Project;
