import { Router } from 'express';
import { authenticate, authorize, validateRequest } from '../../middleware/index.js';
import { asyncHandler } from '../../shared/asyncHandler.js';
import { createMilestoneSchema, updateMilestoneSchema } from './validation.js';
import * as milestoneService from './service.js';
import type { AuthUser } from '../../shared/dataScope.js';

const router = Router({ mergeParams: true });

// GET /api/projects/:id/milestones
router.get(
  '/',
  authenticate,
  authorize(['PM', 'BU_HEAD', 'CFO']),
  asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params.id!, 10);
    const result = await milestoneService.listMilestones(projectId, req.user! as AuthUser);
    res.json(result);
  }),
);

// POST /api/projects/:id/milestones
router.post(
  '/',
  authenticate,
  authorize(['PM']),
  validateRequest(createMilestoneSchema),
  asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params.id!, 10);
    const result = await milestoneService.createMilestone(projectId, req.body, req.user! as AuthUser);
    res.status(201).json(result);
  }),
);

// PUT /api/projects/:id/milestones/:milestoneId
router.put(
  '/:milestoneId',
  authenticate,
  authorize(['PM']),
  validateRequest(updateMilestoneSchema),
  asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params.id!, 10);
    const milestoneId = parseInt(req.params.milestoneId!, 10);
    const result = await milestoneService.updateMilestone(projectId, milestoneId, req.body, req.user! as AuthUser);
    res.json(result);
  }),
);

// DELETE /api/projects/:id/milestones/:milestoneId
router.delete(
  '/:milestoneId',
  authenticate,
  authorize(['PM']),
  asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params.id!, 10);
    const milestoneId = parseInt(req.params.milestoneId!, 10);
    const result = await milestoneService.deleteMilestone(projectId, milestoneId, req.user! as AuthUser);
    res.json(result);
  }),
);

export default router;
