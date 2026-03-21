/**
 * Health Updates routes with Proxy Satisfaction Signals (PRT-41).
 * Mounted at /api/projects/:id/health-updates in index.ts.
 */
import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { asyncHandler } from '../../shared/asyncHandler.js';
import type { AuthUser } from '../../shared/dataScope.js';
import { createHealthUpdateSchema, updateHealthUpdateSchema } from './validation.js';
import * as healthService from './service.js';

const router = Router({ mergeParams: true });

// GET /api/projects/:id/health-updates
router.get(
  '/',
  authenticate,
  authorize(['PM', 'BU_HEAD', 'CFO']),
  asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params['id'] as string, 10);
    const result = await healthService.listHealthUpdates(projectId, req.user! as AuthUser);
    res.json(result);
  }),
);

// GET /api/projects/:id/health-updates/:period
router.get(
  '/:period',
  authenticate,
  authorize(['PM', 'BU_HEAD', 'CFO']),
  asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params['id'] as string, 10);
    const period = req.params['period'] as string;
    const result = await healthService.getHealthUpdate(projectId, period, req.user! as AuthUser);
    res.json(result);
  }),
);

// POST /api/projects/:id/health-updates
router.post(
  '/',
  authenticate,
  authorize(['PM']),
  validateRequest(createHealthUpdateSchema),
  asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params['id'] as string, 10);
    const result = await healthService.createHealthUpdate(
      projectId,
      req.body,
      req.user! as AuthUser,
    );
    res.status(201).json(result);
  }),
);

// PUT /api/projects/:id/health-updates/:period
router.put(
  '/:period',
  authenticate,
  authorize(['PM']),
  validateRequest(updateHealthUpdateSchema),
  asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params['id'] as string, 10);
    const period = req.params['period'] as string;
    const result = await healthService.updateHealthUpdate(
      projectId,
      period,
      req.body,
      req.user! as AuthUser,
    );
    res.json(result);
  }),
);

export default router;
