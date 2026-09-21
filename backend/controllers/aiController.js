import { checkAIHealth, getRecommendations } from '../services/aiService.js';
import Project from '../models/Project.js';
import Student from '../models/Student.js';

// @desc    Check health of the Python AI Matching Service
// @route   GET /api/ai/health
// @access  Private
export const getAIHealth = async (req, res) => {
  try {
    const result = await checkAIHealth();
    
    if (result.status === 'error') {
      return res.status(503).json(result);
    }
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in getAIHealth controller:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// @desc    Match students to a project using AI
// @route   POST /api/ai/match/:projectId
// @access  Private
export const matchProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    // 1. Fetch the project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // 2. Verify authorization
    // Only the creator is allowed to request matching
    if (project.creatorFirebaseUid !== req.user.uid) {
      return res.status(403).json({ message: 'Only the project creator can run AI matching' });
    }

    // 3. Fetch eligible students (excluding the creator)
    const students = await Student.find({ firebaseUid: { $ne: req.user.uid } });

    if (!students || students.length === 0) {
      return res.status(200).json({
        status: 'success',
        message: 'No eligible students found for matching.',
        recommendations: []
      });
    }

    // 4. Map to stripped-down payloads (No sensitive info!)
    const projectPayload = {
      id: project._id.toString(),
      title: project.title,
      description: project.description,
      requiredSkills: project.requiredSkills,
      category: project.category,
      teamSize: project.teamSize,
      duration: project.duration || 'Not specified'
    };

    const studentsPayload = students.map(s => ({
      id: s.firebaseUid,
      name: s.name,
      skills: s.skills || [],
      interests: s.interests || [],
      experience: s.experience || 'Not specified',
      availability: s.availability || 'Not specified'
    }));

    // 5. Call Python FastAPI AI service
    const result = await getRecommendations(projectPayload, studentsPayload);

    if (result.status === 'error') {
      return res.status(503).json({ message: result.message });
    }

    // 6. Return structured Gemini result
    res.status(200).json(result.data);

  } catch (error) {
    console.error('Error in matchProject controller:', error);
    res.status(500).json({ message: 'Internal server error during matching process' });
  }
};
