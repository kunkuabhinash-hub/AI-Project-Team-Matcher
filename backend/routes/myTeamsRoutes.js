import express from 'express';
import { getMyTeams } from '../controllers/teamController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(protect, getMyTeams);

export default router;
