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

    // 3.5 Deterministic validation
    const reqSkillsRaw = project.requiredSkills || [];
    if (reqSkillsRaw.length === 0) {
      return res.status(200).json({
        status: 'success',
        message: 'No suitable teammates found. This project does not have enough skill requirements for matching.',
        recommendations: []
      });
    }

    const reqSkills = reqSkillsRaw.map(s => s.trim().toLowerCase());

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

    const eligibleStudents = [];

    for (const s of students) {
      const sSkillsRaw = s.skills || [];
      const sSkillsNorm = sSkillsRaw.map(x => x.trim().toLowerCase());
      
      const exactMatches = [];
      for (const rawProjSkill of project.requiredSkills) {
        if (sSkillsNorm.includes(rawProjSkill.trim().toLowerCase())) {
          exactMatches.push(rawProjSkill);
        }
      }
      
      if (exactMatches.length > 0) {
        const baseMatchScore = Math.round((exactMatches.length / project.requiredSkills.length) * 100);
        eligibleStudents.push({
          id: s.firebaseUid,
          name: s.fullName,
          skills: s.skills || [],
          interests: s.interests || [],
          experience: s.experience || 'Not specified',
          availability: s.availability || 'Not specified',
          deterministicMatchedSkills: exactMatches,
          baseMatchScore: baseMatchScore
        });
      }
    }

    if (eligibleStudents.length === 0) {
      return res.status(200).json({
        status: 'success',
        message: 'No suitable teammates found. No students currently match the required project skills.',
        recommendations: []
      });
    }

    console.log(`[AI Match] Project requires ${project.requiredSkills.length} skills. Eligible candidates: ${eligibleStudents.length}. Calling Gemini...`);

    // 5. Call Python FastAPI AI service
    const result = await getRecommendations(projectPayload, eligibleStudents);

    if (result.status === 'error') {
      return res.status(503).json({ message: result.message });
    }

    // 6. Enrich AI recommendations with safe profile data from MongoDB
    const enrichedRecommendations = [];
    
    for (const rec of result.data.recommendations) {
      // Find the corresponding student in the local array
      const studentProfile = students.find(s => s.firebaseUid === rec.studentId);
      
      if (!studentProfile) {
        // Validation: If Gemini hallucinates an ID, fail safely per instructions
        console.error(`Gemini recommended invalid studentId: ${rec.studentId}`);
        return res.status(500).json({ message: 'Unable to load one or more recommended student profiles.' });
      }
      
      enrichedRecommendations.push({
        studentId: rec.studentId,
        studentName: studentProfile.fullName,
        skills: studentProfile.skills || [],
        interests: studentProfile.interests || [],
        experience: studentProfile.experience || 'Not specified',
        availability: studentProfile.availability || 'Not specified',
        matchScore: rec.matchScore,
        matchedSkills: rec.matchedSkills,
        matchingReasons: rec.matchingReasons,
        skillGaps: rec.skillGaps
      });
    }

    // Replace the raw recommendations with the enriched ones
    result.data.recommendations = enrichedRecommendations;

    // Fetch the project owner's profile
    const ownerProfile = await Student.findOne({ firebaseUid: project.creatorFirebaseUid });
    const projectOwner = ownerProfile ? {
      studentId: ownerProfile.firebaseUid,
      studentName: ownerProfile.fullName,
      skills: ownerProfile.skills || []
    } : null;

    result.data.projectOwner = projectOwner;

    // We will no longer calculate team coverage statically on the backend, 
    // because the frontend needs to compute it dynamically based on selected members + owner.
    // However, to keep the payload clean, we can omit teamCoverage and skillCoverage entirely.
    
    // 8. Return enriched result
    res.status(200).json(result.data);

  } catch (error) {
    console.error('Error in matchProject controller:', error);
    res.status(500).json({ message: 'Internal server error during matching process' });
  }
};
