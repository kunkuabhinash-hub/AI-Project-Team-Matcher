import Student from '../models/Student.js';

// @desc    Get user profile
// @route   GET /api/profile
// @access  Private
export const getProfile = async (req, res) => {
  try {
    let student = await Student.findOne({ firebaseUid: req.user.uid });
    
    if (!student) {
      // Return a blank profile structure if not found, frontend will handle defaults
      return res.status(200).json({
        fullName: req.user.name || '',
        collegeEmail: req.user.email || '',
        department: '',
        year: '',
        skills: [],
        interests: [],
        experience: '',
        availability: '',
        profileCompleted: false
      });
    }

    res.status(200).json(student);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
};

// @desc    Update user profile
// @route   PUT /api/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const {
      fullName,
      collegeEmail,
      department,
      year,
      skills,
      interests,
      experience,
      availability
    } = req.body;

    // Basic validation
    if (!fullName || !collegeEmail) {
      return res.status(400).json({ message: 'Full Name and College Email are required' });
    }

    // Calculate completion (simple check for essential fields)
    const profileCompleted = !!(department && year && skills?.length > 0 && interests?.length > 0);

    const profileData = {
      firebaseUid: req.user.uid,
      fullName,
      collegeEmail,
      department,
      year,
      skills: Array.isArray(skills) ? skills : [],
      interests: Array.isArray(interests) ? interests : [],
      experience,
      availability,
      profileCompleted
    };

    const student = await Student.findOneAndUpdate(
      { firebaseUid: req.user.uid },
      { $set: profileData },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json(student);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
};
