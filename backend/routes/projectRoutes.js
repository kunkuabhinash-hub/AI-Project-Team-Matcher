import express from 'express';
import { createProject, getProjects, getProjectById, updateProjectStatus } from '../controllers/projectController.js';
import { requestToJoin, getProjectRequests } from '../controllers/joinRequestController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createProject)
  .get(getProjects);

router.route('/:id')
  .get(protect, getProjectById);

router.route('/:id/status')
  .put(protect, updateProjectStatus);

router.route('/:projectId/join')
  .post(protect, requestToJoin);

router.route('/:projectId/join-requests')
  .get(protect, getProjectRequests);

export default router;
