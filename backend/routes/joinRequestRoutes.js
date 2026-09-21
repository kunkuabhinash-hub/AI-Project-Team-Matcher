import express from 'express';
import { getMyRequests, updateRequestStatus } from '../controllers/joinRequestController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/my')
  .get(protect, getMyRequests);

router.route('/:requestId/status')
  .put(protect, updateRequestStatus);

export default router;
