/**
 * Variance routes (PRT-42 / PRT-68).
 * Mounted at /api/projects/:id/variance in index.ts.
 */
import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { asyncHandler } from '../../shared/asyncHandler.js';
import type { AuthUser } from '../../shared/dataScope.js';
import * as varianceService from './service.js';

const router = Router({ mergeParams: true });

// GET /api/projects/:id/variance?startPeriod=YYYY-MM&endPeriod=YYYY-MM
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

    const startPeriod = req.query['startPeriod'] as string | undefined;
    const endPeriod = req.query['endPeriod'] as string | undefined;

    const result = await varianceService.getVariance(
      projectId,
      req.user! as AuthUser,
      startPeriod,
      endPeriod,
    );
    res.json(result);
  }),
);

export default router;
