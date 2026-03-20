import { Router } from 'express';
import { authenticate, authorize, validateRequest } from '../../middleware/index.js';
import { asyncHandler } from '../../shared/asyncHandler.js';
import { createHealthUpdateSchema } from './validation.js';
import * as healthUpdateService from './service.js';
import type { AuthUser } from '../../shared/dataScope.js';

const router = Router({ mergeParams: true });

// GET /api/projects/:id/health-updates
router.get(
  '/',
  authenticate,
  authorize(['PM', 'BU_HEAD', 'CFO']),
  asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params.id as string, 10);
    const result = await healthUpdateService.listHealthUpdates(projectId, req.user! as AuthUser);
    res.json(result);
  }),
);

// GET /api/projects/:id/health-updates/:period
router.get(
  '/:period',
  authenticate,
  authorize(['PM', 'BU_HEAD', 'CFO']),
  asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params.id as string, 10);
    const period = req.params.period as string;
    const result = await healthUpdateService.getHealthUpdate(projectId, period, req.user! as AuthUser);
    res.json(result);
  }),
);

// PUT /api/projects/:id/health-updates
router.put(
  '/',
  authenticate,
  authorize(['PM']),
  validateRequest(createHealthUpdateSchema),
  asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params.id as string, 10);
    const result = await healthUpdateService.upsertHealthUpdate(projectId, req.body, req.user! as AuthUser);
    res.json(result);
  }),
);

export default router;
