import { Router } from 'express';
import { authenticate, authorize, validateRequest } from '../../middleware/index.js';
import { asyncHandler } from '../../shared/asyncHandler.js';
import { createRiskSchema, updateRiskSchema, updateRiskStatusSchema } from './validation.js';
import * as riskService from './service.js';
import type { AuthUser } from '../../shared/dataScope.js';

const router = Router({ mergeParams: true });

// GET /api/projects/:id/risks
router.get(
  '/',
  authenticate,
  authorize(['PM', 'BU_HEAD', 'CFO']),
  asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params.id as string, 10);
    const result = await riskService.listRisks(projectId, req.user! as AuthUser);
    res.json(result);
  }),
);

// POST /api/projects/:id/risks
router.post(
  '/',
  authenticate,
  authorize(['PM']),
  validateRequest(createRiskSchema),
  asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params.id as string, 10);
    const result = await riskService.createRisk(projectId, req.body, req.user! as AuthUser);
    res.status(201).json(result);
  }),
);

// PUT /api/projects/:id/risks/:riskId
router.put(
  '/:riskId',
  authenticate,
  authorize(['PM']),
  validateRequest(updateRiskSchema),
  asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params.id as string, 10);
    const riskId = parseInt(req.params.riskId as string, 10);
    const result = await riskService.updateRisk(projectId, riskId, req.body, req.user! as AuthUser);
    res.json(result);
  }),
);

// PATCH /api/projects/:id/risks/:riskId/status
router.patch(
  '/:riskId/status',
  authenticate,
  authorize(['PM']),
  validateRequest(updateRiskStatusSchema),
  asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params.id as string, 10);
    const riskId = parseInt(req.params.riskId as string, 10);
    const result = await riskService.updateRiskStatus(projectId, riskId, req.body, req.user! as AuthUser);
    res.json(result);
  }),
);

export default router;
