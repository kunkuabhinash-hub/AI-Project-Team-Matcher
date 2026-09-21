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
      name: s.fullName,
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

    // 7. Deterministic Team-Level Skill Coverage Analysis
    const normalizeSkill = (skill) => skill.trim().toLowerCase();
    
    const coveredSkillsMap = new Map(); // Normalized skill -> Original skill
    const missingSkills = [];
    const skillCoverage = [];

    // Track which student covers what
    const skillToStudentsMap = {}; // Normalized skill -> Array of {studentId, studentName}

    // Initialize missing skills and skill coverage
    project.requiredSkills.forEach(reqSkill => {
      const normReqSkill = normalizeSkill(reqSkill);
      skillToStudentsMap[normReqSkill] = [];
      skillCoverage.push({
        skill: reqSkill,
        covered: false,
        students: []
      });
    });

    // Populate skill coverage from recommended students
    enrichedRecommendations.forEach(rec => {
      rec.skills.forEach(studentSkill => {
        const normStudentSkill = normalizeSkill(studentSkill);
        if (skillToStudentsMap[normStudentSkill] !== undefined) {
          // This required skill is covered by this student
          const existingStudents = skillToStudentsMap[normStudentSkill];
          // Prevent duplicates
          if (!existingStudents.some(s => s.studentId === rec.studentId)) {
             existingStudents.push({
               studentId: rec.studentId,
               studentName: rec.studentName
             });
          }
        }
      });
    });

    // Finalize skillCoverage array and build missing/covered lists
    const coveredSkills = [];
    skillCoverage.forEach(sc => {
      const normSkill = normalizeSkill(sc.skill);
      const coveringStudents = skillToStudentsMap[normSkill];
      
      if (coveringStudents && coveringStudents.length > 0) {
        sc.covered = true;
        sc.students = coveringStudents;
        coveredSkills.push(sc.skill); // Use original required skill name
      } else {
        missingSkills.push(sc.skill);
      }
    });

    const totalRequired = project.requiredSkills.length;
    const coveragePercentage = totalRequired === 0 ? 100 : Math.round((coveredSkills.length / totalRequired) * 100);

    result.data.teamCoverage = {
      requiredSkills: project.requiredSkills,
      coveredSkills,
      missingSkills,
      coveragePercentage
    };
    result.data.skillCoverage = skillCoverage;

    // 8. Return enriched result with coverage
    res.status(200).json(result.data);

  } catch (error) {
    console.error('Error in matchProject controller:', error);
    res.status(500).json({ message: 'Internal server error during matching process' });
  }
};
