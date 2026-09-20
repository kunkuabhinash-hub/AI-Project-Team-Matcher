import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true
  },
  fullName: {
    type: String,
    required: true
  },
  collegeEmail: {
    type: String,
    required: true,
    unique: true
  },
  department: {
    type: String,
    default: ''
  },
  year: {
    type: String,
    default: ''
  },
  skills: {
    type: [String],
    default: []
  },
  interests: {
    type: [String],
    default: []
  },
  experience: {
    type: String,
    default: ''
  },
  availability: {
    type: String,
    default: ''
  },
  profileCompleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

const Student = mongoose.model('Student', studentSchema);

export default Student;
