import Project from '../models/Project.js';
import Team from '../models/Team.js';
import TeamInvitation from '../models/TeamInvitation.js';

// Helper function to sync automatic project status
export const syncProjectStatus = async (projectId) => {
  try {
    const project = await Project.findById(projectId);
    if (!project) return;

    // Do not automatically override Completed or Cancelled
    if (project.status === 'Completed' || project.status === 'Cancelled') {
      return;
    }

    let nextStatus = 'Planning';

    const team = await Team.findOne({ projectId });
    // Assuming teamSize includes the owner. memberStudentIds usually includes the owner.
    const currentMembers = team ? team.memberStudentIds.length : 1; 

    if (currentMembers >= project.teamSize) {
      nextStatus = 'In Progress';
    } else {
      const pendingInvitations = await TeamInvitation.countDocuments({
        projectId,
        status: 'pending'
      });
      if (pendingInvitations > 0) {
        nextStatus = 'Team Forming';
      }
    }

    if (project.status !== nextStatus) {
      project.status = nextStatus;
      await project.save();
    }
  } catch (error) {
    console.error('Error in syncProjectStatus:', error);
  }
};

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
export const createProject = async (req, res) => {
  try {
    const { title, description, requiredSkills, category, teamSize, duration } = req.body;

    // Validate required fields
    if (!title || !description || !category || !teamSize) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (!Array.isArray(requiredSkills) || requiredSkills.length === 0) {
      return res.status(400).json({ message: 'At least one required skill is needed' });
    }

    // req.user comes from the authMiddleware after verifying the Firebase ID token
    const project = new Project({
      title,
      description,
      requiredSkills,
      category,
      teamSize: Number(teamSize),
      duration,
      creatorFirebaseUid: req.user.uid,
      creatorName: req.user.name || 'Student',
      creatorEmail: req.user.email || ''
    });

    const createdProject = await project.save();
    res.status(201).json(createdProject);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ message: error.message || 'Server error creating project' });
  }
};

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
export const getProjects = async (req, res) => {
  try {
    // Return newest projects first
    const projects = await Project.find({}).sort({ createdAt: -1 });
    res.status(200).json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Server error fetching projects' });
  }
};

// @desc    Get a single project by ID
// @route   GET /api/projects/:id
// @access  Private
export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    res.status(200).json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(500).json({ message: 'Server error fetching project' });
  }
};

// @desc    Update project status
// @route   PUT /api/projects/:id/status
// @access  Private
export const updateProjectStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['Completed', 'Cancelled'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value. Only Completed and Cancelled can be manually set.' });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.creatorFirebaseUid !== req.user.uid) {
      return res.status(403).json({ message: 'Not authorized to update project status' });
    }

    project.status = status;
    const updatedProject = await project.save();

    res.status(200).json(updatedProject);
  } catch (error) {
    console.error('Error updating project status:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(500).json({ message: 'Server error updating project status' });
  }
};
