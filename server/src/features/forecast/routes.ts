/**
 * Forecast routes (PRT-38).
 * Mounted at /api/projects/:id/forecast in index.ts.
 */
import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { asyncHandler } from '../../shared/asyncHandler.js';
import type { AuthUser } from '../../shared/dataScope.js';
import * as forecastService from './service.js';

const router = Router({ mergeParams: true });

// GET /api/projects/:id/forecast
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

    const result = await forecastService.getForecast(
      projectId,
      req.user! as AuthUser,
    );
    res.json(result);
  }),
);

export default router;
