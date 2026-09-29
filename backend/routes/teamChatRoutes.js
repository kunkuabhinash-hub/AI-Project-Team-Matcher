import express from 'express';
import { getTeamMessages, sendTeamMessage } from '../controllers/teamChatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/:teamId/messages')
  .get(protect, getTeamMessages)
  .post(protect, sendTeamMessage);

export default router;
