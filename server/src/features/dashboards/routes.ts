import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/index.js';
import { asyncHandler } from '../../shared/asyncHandler.js';
import type { AuthUser } from '../../shared/dataScope.js';
import * as dashboardService from './service.js';

const router = Router();

// GET /api/dashboards/pm
router.get(
  '/pm',
  authenticate,
  authorize(['PM', 'BU_HEAD', 'CFO']),
  asyncHandler(async (req, res) => {
    const user = (req as any).user as AuthUser;
    const result = await dashboardService.getPmDashboard(user);
    res.json(result);
  }),
);

export default router;
