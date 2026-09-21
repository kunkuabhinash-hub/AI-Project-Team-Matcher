import express from 'express';
import { getAIHealth, matchProject } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/health')
  .get(protect, getAIHealth);

router.route('/match/:projectId')
  .post(protect, matchProject);

export default router;
