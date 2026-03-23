import { Router } from 'express';
import { authenticate, authorize, validateRequest } from '../../middleware/index.js';
import { asyncHandler } from '../../shared/asyncHandler.js';
import { saveBudgetPlanSchema } from './validation.js';
import * as budgetService from './service.js';
import type { AuthUser } from '../../shared/dataScope.js';

const router = Router({ mergeParams: true });

// GET /api/projects/:projectId/budget
router.get(
  '/',
  authenticate,
  authorize(['PM', 'BU_HEAD', 'CFO']),
  asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params.projectId as string, 10);
    const result = await budgetService.getBudgetPlan(projectId, req.user! as AuthUser);
    res.json(result);
  }),
);

// POST /api/projects/:projectId/budget
router.post(
  '/',
  authenticate,
  authorize(['PM']),
  validateRequest(saveBudgetPlanSchema),
  asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params.projectId as string, 10);
    const result = await budgetService.saveBudgetPlan(projectId, req.body, req.user! as AuthUser);
    res.json(result);
  }),
);

export default router;
