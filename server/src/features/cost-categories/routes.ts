import { Router } from 'express';
import { authenticate, authorize, validateRequest, validateQuery } from '../../middleware/index.js';
import { asyncHandler } from '../../shared/asyncHandler.js';
import type { AuthUser } from '../../shared/dataScope.js';
import {
  upsertPlannedAmountSchema,
  batchUpsertPlannedAmountsSchema,
  createCostEntrySchema,
  updateCostEntrySchema,
  batchUpsertCostEntriesSchema,
  periodQuerySchema,
} from './validation.js';
import * as costService from './service.js';

const router = Router({ mergeParams: true });

// ─── Cost Categories ───

// GET /api/projects/:id/cost-categories
router.get(
  '/',
  authenticate,
  authorize(['PM', 'BU_HEAD', 'CFO']),
  asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params.id as string, 10);
    const user = (req as any).user as AuthUser;
    const result = await costService.listCostCategories(projectId, user);
    res.json(result);
  }),
);

// ─── Planned Amounts ───

// GET /api/projects/:id/planned-amounts?period=YYYY-MM
router.get(
  '/planned-amounts',
  authenticate,
  authorize(['PM', 'BU_HEAD', 'CFO']),
  asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params.id as string, 10);
    const user = (req as any).user as AuthUser;
    const period = req.query.period as string | undefined;
    const result = await costService.listPlannedAmounts(projectId, user, period);
    res.json(result);
  }),
);

// PUT /api/projects/:id/planned-amounts (batch upsert)
router.put(
  '/planned-amounts',
  authenticate,
  authorize(['PM']),
  validateRequest(batchUpsertPlannedAmountsSchema),
  asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params.id as string, 10);
    const user = (req as any).user as AuthUser;
    const result = await costService.batchUpsertPlannedAmounts(projectId, req.body.items, user);
    res.json(result);
  }),
);

// PUT /api/projects/:id/cost-categories/:categoryId/planned-amounts
router.put(
  '/:categoryId/planned-amounts',
  authenticate,
  authorize(['PM']),
  validateRequest(upsertPlannedAmountSchema),
  asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params.id as string, 10);
    const categoryId = parseInt(req.params.categoryId as string, 10);
    const user = (req as any).user as AuthUser;
    const result = await costService.upsertPlannedAmount(projectId, categoryId, req.body.period, req.body.amount, user);
    res.json(result);
  }),
);

// ─── Cost Entries ───

// GET /api/projects/:id/cost-entries?period=YYYY-MM
router.get(
  '/cost-entries',
  authenticate,
  authorize(['PM', 'BU_HEAD', 'CFO']),
  asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params.id as string, 10);
    const user = (req as any).user as AuthUser;
    const period = req.query.period as string | undefined;
    const result = await costService.listCostEntries(projectId, user, period);
    res.json(result);
  }),
);

// POST /api/projects/:id/cost-entries (single entry)
router.post(
  '/cost-entries',
  authenticate,
  authorize(['PM']),
  validateRequest(createCostEntrySchema),
  asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params.id as string, 10);
    const user = (req as any).user as AuthUser;
    const { costCategoryId, period, actualAmount, notes } = req.body;
    const result = await costService.upsertCostEntry(projectId, costCategoryId, period, actualAmount, notes, user);
    res.status(201).json(result);
  }),
);

// PUT /api/projects/:id/cost-entries (batch upsert)
router.put(
  '/cost-entries',
  authenticate,
  authorize(['PM']),
  validateRequest(batchUpsertCostEntriesSchema),
  asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params.id as string, 10);
    const user = (req as any).user as AuthUser;
    const result = await costService.batchUpsertCostEntries(projectId, req.body.items, user);
    res.json(result);
  }),
);

// GET /api/projects/:id/cost-entries/:entryId/audit
router.get(
  '/cost-entries/:entryId/audit',
  authenticate,
  authorize(['PM', 'BU_HEAD', 'CFO']),
  asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params.id as string, 10);
    const entryId = parseInt(req.params.entryId as string, 10);
    const user = (req as any).user as AuthUser;
    const result = await costService.getCostEntryAudit(projectId, entryId, user);
    res.json(result);
  }),
);

// ─── Variance & Calculations ───

// GET /api/projects/:id/variance?period=YYYY-MM
router.get(
  '/variance',
  authenticate,
  authorize(['PM', 'BU_HEAD', 'CFO']),
  asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params.id as string, 10);
    const user = (req as any).user as AuthUser;
    const period = req.query.period as string;
    if (!period || !/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'period query parameter is required (YYYY-MM)' } });
      return;
    }
    const result = await costService.getVariance(projectId, period, user);
    res.json(result);
  }),
);

// GET /api/projects/:id/burn-rate
router.get(
  '/burn-rate',
  authenticate,
  authorize(['PM', 'BU_HEAD', 'CFO']),
  asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params.id as string, 10);
    const user = (req as any).user as AuthUser;
    const result = await costService.getBurnRate(projectId, user);
    res.json(result);
  }),
);

// GET /api/projects/:id/dashboard
router.get(
  '/dashboard',
  authenticate,
  authorize(['PM', 'BU_HEAD', 'CFO']),
  asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params.id as string, 10);
    const user = (req as any).user as AuthUser;
    const result = await costService.getDashboard(projectId, user);
    res.json(result);
  }),
);

export default router;
