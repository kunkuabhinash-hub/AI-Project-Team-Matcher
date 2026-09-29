import Project from '../models/Project.js';
import Student from '../models/Student.js';
import Team from '../models/Team.js';
import mongoose from 'mongoose';
import { syncProjectStatus } from './projectController.js';

// @desc    Form a team for a project
// @route   POST /api/projects/:projectId/team
// @access  Private
export const createTeam = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { selectedStudentIds } = req.body;

    if (!Array.isArray(selectedStudentIds)) {
      return res.status(400).json({ message: 'selectedStudentIds must be an array' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.creatorFirebaseUid !== req.user.uid) {
      return res.status(403).json({ message: 'Only the project creator can form a team' });
    }

    const existingTeam = await Team.findOne({ projectId });
    if (existingTeam) {
      return res.status(409).json({ message: 'A team already exists for this project' });
    }

    const ownerStudent = await Student.findOne({ firebaseUid: req.user.uid });
    if (!ownerStudent) {
      return res.status(404).json({ message: 'Owner student profile not found' });
    }

    // Deduplicate IDs and remove owner if mistakenly included
    const uniqueSelectedIds = [...new Set(selectedStudentIds)].filter(
      id => id !== ownerStudent.firebaseUid && id !== ownerStudent._id.toString()
    );

    const finalMemberCount = 1 + uniqueSelectedIds.length;
    if (finalMemberCount > project.teamSize) {
      return res.status(400).json({ message: `Team size exceeds maximum allowed (${project.teamSize})` });
    }

    // Resolve Firebase UIDs to MongoDB ObjectIds
    const memberObjectIds = [ownerStudent._id];
    for (const uid of uniqueSelectedIds) {
      let student = await Student.findOne({ firebaseUid: uid });
      
      // Fallback if the frontend accidentally sent a MongoDB ObjectId
      if (!student && mongoose.Types.ObjectId.isValid(uid)) {
        student = await Student.findById(uid);
      }

      if (!student) {
        return res.status(400).json({ message: `Invalid student ID: ${uid}` });
      }
      memberObjectIds.push(student._id);
    }

    const team = await Team.create({
      projectId: project._id,
      ownerStudentId: ownerStudent._id,
      memberStudentIds: memberObjectIds
    });

    const populatedTeam = await Team.findById(team._id)
      .populate('ownerStudentId', 'fullName skills interests experience availability firebaseUid collegeEmail')
      .populate('memberStudentIds', 'fullName skills interests experience availability firebaseUid collegeEmail');

    await syncProjectStatus(project._id);

    res.status(201).json(populatedTeam);

  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ message: 'Internal server error forming team' });
  }
};

// @desc    Get formed team for a project
// @route   GET /api/projects/:projectId/team
// @access  Private
export const getTeam = async (req, res) => {
  try {
    const { projectId } = req.params;

    const team = await Team.findOne({ projectId })
      .populate('ownerStudentId', 'fullName skills interests experience availability firebaseUid collegeEmail')
      .populate('memberStudentIds', 'fullName skills interests experience availability firebaseUid collegeEmail');

    if (!team) {
      return res.status(404).json({ message: 'No team found for this project' });
    }

    res.status(200).json(team);

  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({ message: 'Internal server error fetching team' });
  }
};

// @desc    Delete a formed team
// @route   DELETE /api/projects/:projectId/team
// @access  Private
export const deleteTeam = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.creatorFirebaseUid !== req.user.uid) {
      return res.status(403).json({ message: 'Only the project creator can delete the team' });
    }

    const team = await Team.findOneAndDelete({ projectId });
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    await syncProjectStatus(projectId);

    res.status(200).json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({ message: 'Internal server error deleting team' });
  }
};

// @desc    Get teams where the logged-in student is a member
// @route   GET /api/my-teams
// @access  Private
export const getMyTeams = async (req, res) => {
  try {
    const student = await Student.findOne({ firebaseUid: req.user.uid });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const teams = await Team.find({
      memberStudentIds: student._id
    })
    .populate('projectId')
    .populate('ownerStudentId', 'fullName')
    .populate('memberStudentIds', 'fullName');

    // Filter and format results
    const myTeams = teams.filter(team => team.projectId).map(team => {
      const project = team.projectId;
      return {
        _id: project._id,
        projectId: project._id,
        title: project.title,
        description: project.description,
        category: project.category,
        teamSize: project.teamSize,
        currentMembersCount: team.memberStudentIds.length,
        duration: project.duration,
        status: project.status,
        creatorName: project.creatorName,
        creatorFirebaseUid: project.creatorFirebaseUid,
        createdAt: project.createdAt
      };
    });

    res.status(200).json(myTeams);
  } catch (error) {
    console.error('Error fetching my teams:', error);
    res.status(500).json({ message: 'Internal server error fetching my teams' });
  }
};
