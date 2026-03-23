import { Router } from 'express';
import { authenticate, authorize, validateRequest } from '../../middleware/index.js';
import { asyncHandler } from '../../shared/asyncHandler.js';
import { createAllocationSchema } from './validation.js';
import * as allocationService from './service.js';
import type { AuthUser } from '../../shared/dataScope.js';

const router = Router({ mergeParams: true });

// GET /api/projects/:projectId/allocations
router.get(
  '/',
  authenticate,
  authorize(['PM', 'BU_HEAD', 'CFO']),
  asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params.projectId as string, 10);
    const result = await allocationService.listAllocations(projectId, req.user! as AuthUser);
    res.json(result);
  }),
);

// POST /api/projects/:projectId/allocations
router.post(
  '/',
  authenticate,
  authorize(['PM']),
  validateRequest(createAllocationSchema),
  asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params.projectId as string, 10);
    const result = await allocationService.createAllocation(projectId, req.body, req.user! as AuthUser);
    res.status(201).json(result);
  }),
);

// DELETE /api/projects/:projectId/allocations/:id
router.delete(
  '/:id',
  authenticate,
  authorize(['PM']),
  asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params.projectId as string, 10);
    const allocationId = parseInt(req.params.id as string, 10);
    const result = await allocationService.deleteAllocation(projectId, allocationId, req.user! as AuthUser);
    res.json(result);
  }),
);

export default router;
