import express from 'express';
import { createTeam, getTeam, deleteTeam } from '../controllers/teamController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/:projectId/team')
  .post(protect, createTeam)
  .get(protect, getTeam)
  .delete(protect, deleteTeam);

export default router;
