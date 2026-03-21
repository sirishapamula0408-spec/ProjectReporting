/**
 * Dashboard routes (PRT-43).
 * Mounted at /api/dashboards in index.ts.
 */
import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { asyncHandler } from '../../shared/asyncHandler.js';
import * as cfoService from './cfoService.js';

const router = Router();

// GET /api/dashboards/cfo
router.get(
  '/cfo',
  authenticate,
  authorize(['CFO']),
  asyncHandler(async (_req, res) => {
    const result = await cfoService.getCFODashboard();
    res.json(result);
  }),
);

export default router;
