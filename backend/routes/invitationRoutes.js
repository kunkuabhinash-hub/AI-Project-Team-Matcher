import express from 'express';
import {
    createInvitations,
    getStudentInvitations,
    getProjectInvitations,
    respondToInvitation
} from '../controllers/invitationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true }); // mergeParams to access projectId

// Routes for /api/invitations
// (We will mount some directly on /api/invitations and some on /api/projects/:projectId/invitations)

router.post('/projects/:projectId/invitations', protect, createInvitations);
router.get('/projects/:projectId/invitations', protect, getProjectInvitations);
router.get('/invitations/student', protect, getStudentInvitations);
router.put('/invitations/:id/respond', protect, respondToInvitation);

export default router;
