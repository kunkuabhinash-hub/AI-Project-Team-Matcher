import Project from '../models/Project.js';
import Student from '../models/Student.js';
import Team from '../models/Team.js';
import TeamInvitation from '../models/TeamInvitation.js';
import mongoose from 'mongoose';
import { syncProjectStatus } from './projectController.js';

// @desc    Create team invitations for selected students
// @route   POST /api/projects/:projectId/invitations
// @access  Private
export const createInvitations = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { selectedStudentIds } = req.body; // Array of Firebase UIDs

    if (!Array.isArray(selectedStudentIds) || selectedStudentIds.length === 0) {
      return res.status(400).json({ message: 'selectedStudentIds must be a non-empty array' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.creatorFirebaseUid !== req.user.uid) {
      return res.status(403).json({ message: 'Only the project creator can send invitations' });
    }

    // Check existing team members
    let existingTeam = await Team.findOne({ projectId });
    let currentMembersCount = existingTeam ? existingTeam.memberStudentIds.length : 1; // 1 for owner

    // Check existing pending invitations for this project
    const existingPendingInvitations = await TeamInvitation.find({
      projectId,
      status: 'pending'
    });

    // Deduplicate UIDs and filter out owner
    const uniqueSelectedIds = [...new Set(selectedStudentIds)].filter(uid => uid !== req.user.uid);

    // Filter out students who already have a pending invitation or are already in the active team
    const idsToInvite = [];
    for (const uid of uniqueSelectedIds) {
       const hasPending = existingPendingInvitations.some(inv => inv.recipientFirebaseUid === uid);
       
       let inTeam = false;
       if (existingTeam) {
           const student = await Student.findOne({ firebaseUid: uid });
           if (student && existingTeam.memberStudentIds.includes(student._id)) {
               inTeam = true;
           }
       }

       if (!hasPending && !inTeam) {
           idsToInvite.push(uid);
       }
    }

    if (idsToInvite.length === 0) {
        return res.status(400).json({ message: 'All selected students have already been invited or added.' });
    }

    // Verify all idsToInvite actually exist in MongoDB
    for (const uid of idsToInvite) {
        const student = await Student.findOne({ firebaseUid: uid });
        if (!student) {
            return res.status(400).json({ message: `Student with ID ${uid} not found in database.` });
        }
    }

    // We don't strictly enforce capacity here against pending invites, but we do limit creating new invites 
    // if accepted/team members already maxed out. Actually, we should allow sending invites and strictly enforce on Accept.
    if (currentMembersCount >= project.teamSize) {
        return res.status(400).json({ message: 'Team is already full.' });
    }

    // Create invitations
    const invitations = await Promise.all(idsToInvite.map(async (uid) => {
        return await TeamInvitation.create({
            projectId: project._id,
            senderFirebaseUid: req.user.uid,
            recipientFirebaseUid: uid,
            status: 'pending'
        });
    }));

    res.status(201).json({ message: 'Invitations sent successfully', count: invitations.length });

    // Sync project status after creating invitations
    await syncProjectStatus(project._id);

  } catch (error) {
    console.error('Error creating invitations:', error);
    res.status(500).json({ message: 'Internal server error sending invitations' });
  }
};

// @desc    Get invitations for the logged-in student
// @route   GET /api/invitations/student
// @access  Private
export const getStudentInvitations = async (req, res) => {
    try {
        const invitations = await TeamInvitation.find({ recipientFirebaseUid: req.user.uid, status: 'pending' })
            .populate('projectId', 'title category teamSize')
            .sort({ createdAt: -1 });

        // Fetch sender names
        const populatedInvitations = await Promise.all(invitations.map(async (inv) => {
            const sender = await Student.findOne({ firebaseUid: inv.senderFirebaseUid });
            return {
                ...inv.toObject(),
                senderName: sender ? sender.fullName : 'Unknown User'
            };
        }));

        res.status(200).json(populatedInvitations);
    } catch (error) {
        console.error('Error fetching student invitations:', error);
        res.status(500).json({ message: 'Internal server error fetching invitations' });
    }
};

// @desc    Get invitations for a project (for owner)
// @route   GET /api/projects/:projectId/invitations
// @access  Private
export const getProjectInvitations = async (req, res) => {
    try {
        const { projectId } = req.params;

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        if (project.creatorFirebaseUid !== req.user.uid) {
            return res.status(403).json({ message: 'Only the project creator can view invitations' });
        }

        const invitations = await TeamInvitation.find({ projectId }).sort({ createdAt: -1 });

        const populatedInvitations = await Promise.all(invitations.map(async (inv) => {
            const recipient = await Student.findOne({ firebaseUid: inv.recipientFirebaseUid });
            return {
                ...inv.toObject(),
                recipientName: recipient ? recipient.fullName : 'Unknown User',
                recipientEmail: recipient ? recipient.collegeEmail : ''
            };
        }));

        res.status(200).json(populatedInvitations);
    } catch (error) {
        console.error('Error fetching project invitations:', error);
        res.status(500).json({ message: 'Internal server error fetching invitations' });
    }
};

// @desc    Respond to an invitation (Accept/Reject)
// @route   PUT /api/invitations/:id/respond
// @access  Private
export const respondToInvitation = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'accepted' or 'rejected'

        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const invitation = await TeamInvitation.findById(id);
        if (!invitation) {
            return res.status(404).json({ message: 'Invitation not found' });
        }

        if (invitation.recipientFirebaseUid !== req.user.uid) {
            return res.status(403).json({ message: 'Not authorized to respond to this invitation' });
        }

        if (invitation.status !== 'pending') {
            return res.status(400).json({ message: `Invitation is already ${invitation.status}` });
        }

        const project = await Project.findById(invitation.projectId);
        if (!project) {
             return res.status(404).json({ message: 'Project no longer exists' });
        }

        if (status === 'accepted') {
            // Find or create Team
            let team = await Team.findOne({ projectId: project._id });
            
            const ownerStudent = await Student.findOne({ firebaseUid: project.creatorFirebaseUid });
            const recipientStudent = await Student.findOne({ firebaseUid: req.user.uid });

            if (!recipientStudent) {
                 return res.status(404).json({ message: 'Student profile not found' });
            }

            if (!team) {
                if (!ownerStudent) {
                     return res.status(404).json({ message: 'Project owner profile not found' });
                }
                // Create team with owner and the accepting student
                team = new Team({
                    projectId: project._id,
                    ownerStudentId: ownerStudent._id,
                    memberStudentIds: [ownerStudent._id, recipientStudent._id]
                });
            } else {
                // Check capacity
                if (team.memberStudentIds.length >= project.teamSize) {
                    return res.status(400).json({ message: 'Team is already full' });
                }
                // Add student if not already in team
                if (!team.memberStudentIds.includes(recipientStudent._id)) {
                    team.memberStudentIds.push(recipientStudent._id);
                }
            }
            await team.save();
        }

        invitation.status = status;
        await invitation.save();

        res.status(200).json({ message: `Invitation ${status} successfully` });

        // Sync project status after invitation response
        await syncProjectStatus(project._id);
    } catch (error) {
        console.error('Error responding to invitation:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
