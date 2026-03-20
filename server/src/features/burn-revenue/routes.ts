/**
 * Burn vs Revenue routes (PRT-39 / PRT-64).
 * Mounted at /api/projects/:id/burn-revenue in index.ts.
 */
import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { asyncHandler } from '../../shared/asyncHandler.js';
import type { AuthUser } from '../../shared/dataScope.js';
import * as burnRevenueService from './service.js';

const router = Router({ mergeParams: true });

// GET /api/projects/:id/burn-revenue
router.get(
  '/',
  authenticate,
  authorize(['PM', 'BU_HEAD', 'CFO']),
  asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params['id'] as string, 10);

    if (isNaN(projectId)) {
      res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid project ID' },
      });
      return;
    }

    const fromMonth = req.query['fromMonth'] as string | undefined;
    const toMonth = req.query['toMonth'] as string | undefined;

    const result = await burnRevenueService.getBurnRevenue(
      projectId,
      req.user! as AuthUser,
      fromMonth,
      toMonth,
    );
    res.json(result);
  }),
);

export default router;
