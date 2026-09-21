import express from 'express';
import { getAIHealth } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/health')
  .get(protect, getAIHealth);

export default router;
