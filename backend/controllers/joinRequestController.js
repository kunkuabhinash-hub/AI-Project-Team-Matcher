import JoinRequest from '../models/JoinRequest.js';
import Project from '../models/Project.js';
import Student from '../models/Student.js';

// @desc    Request to join a project
// @route   POST /api/projects/:projectId/join
// @access  Private
export const requestToJoin = async (req, res) => {
  try {
    const { projectId } = req.params;
    const studentFirebaseUid = req.user.uid;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.creatorFirebaseUid === studentFirebaseUid) {
      return res.status(400).json({ message: 'You cannot request to join your own project' });
    }

    // Check for existing pending or accepted requests
    const existingRequest = await JoinRequest.findOne({
      projectId,
      studentFirebaseUid,
      status: { $in: ['pending', 'accepted'] }
    });

    if (existingRequest) {
      return res.status(400).json({ message: `You already have a ${existingRequest.status} request for this project` });
    }

    const student = await Student.findOne({ firebaseUid: studentFirebaseUid });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found. Please complete your profile first.' });
    }

    const joinRequest = new JoinRequest({
      projectId,
      studentFirebaseUid,
      studentName: student.fullName,
      studentEmail: student.collegeEmail
    });

    const createdRequest = await joinRequest.save();
    res.status(201).json(createdRequest);
  } catch (error) {
    console.error('Error creating join request:', error);
    res.status(500).json({ message: 'Server error creating join request' });
  }
};

// @desc    Get logged in student's join requests
// @route   GET /api/join-requests/my
// @access  Private
export const getMyRequests = async (req, res) => {
  try {
    const requests = await JoinRequest.find({ studentFirebaseUid: req.user.uid })
      .populate('projectId', 'title category')
      .sort({ createdAt: -1 });
    
    res.status(200).json(requests);
  } catch (error) {
    console.error('Error fetching my requests:', error);
    res.status(500).json({ message: 'Server error fetching requests' });
  }
};

// @desc    Get join requests for a project (Owner only)
// @route   GET /api/projects/:projectId/join-requests
// @access  Private
export const getProjectRequests = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.creatorFirebaseUid !== req.user.uid) {
      return res.status(403).json({ message: 'Not authorized to view these requests' });
    }

    const requests = await JoinRequest.find({ projectId }).sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error) {
    console.error('Error fetching project requests:', error);
    res.status(500).json({ message: 'Server error fetching project requests' });
  }
};

// @desc    Update join request status (Accept/Reject)
// @route   PUT /api/join-requests/:requestId/status
// @access  Private
export const updateRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const joinRequest = await JoinRequest.findById(requestId);
    if (!joinRequest) {
      return res.status(404).json({ message: 'Join request not found' });
    }

    const project = await Project.findById(joinRequest.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Associated project not found' });
    }

    if (project.creatorFirebaseUid !== req.user.uid) {
      return res.status(403).json({ message: 'Not authorized to update this request' });
    }

    if (status === 'accepted') {
      // Check team size
      const acceptedCount = await JoinRequest.countDocuments({
        projectId: project._id,
        status: 'accepted'
      });
      
      // The creator is 1 member. So acceptedCount + 1 must be < project.teamSize
      if (acceptedCount + 1 >= project.teamSize) {
        return res.status(400).json({ message: 'Project team size is already full' });
      }
    }

    joinRequest.status = status;
    const updatedRequest = await joinRequest.save();

    res.status(200).json(updatedRequest);
  } catch (error) {
    console.error('Error updating request status:', error);
    res.status(500).json({ message: 'Server error updating request status' });
  }
};
