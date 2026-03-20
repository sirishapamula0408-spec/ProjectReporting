import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/index.js';
import { asyncHandler } from '../../shared/asyncHandler.js';
import * as dashboardService from './service.js';
import type { AuthUser } from '../../shared/dataScope.js';

const router = Router();

// GET /api/dashboards/pm
router.get(
  '/pm',
  authenticate,
  authorize(['PM']),
  asyncHandler(async (req, res) => {
    const result = await dashboardService.getPMDashboard(req.user! as AuthUser);
    res.json(result);
  }),
);

// GET /api/dashboards/project/:projectId
router.get(
  '/project/:projectId',
  authenticate,
  authorize(['PM', 'BU_HEAD', 'CFO']),
  asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params.projectId as string, 10);
    const result = await dashboardService.getProjectDashboard(projectId, req.user! as AuthUser);
    res.json(result);
  }),
);

// GET /api/dashboards/portfolio — Portfolio dashboard (BU_HEAD and CFO only)
router.get(
  '/portfolio',
  authenticate,
  authorize(['BU_HEAD', 'CFO']),
  asyncHandler(async (req, res) => {
    const result = await dashboardService.getPortfolioDashboard(req.user! as AuthUser);
    res.json(result);
  }),
);

export default router;
