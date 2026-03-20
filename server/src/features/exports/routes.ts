import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/index.js';
import { asyncHandler } from '../../shared/asyncHandler.js';
import * as exportService from './service.js';
import type { AuthUser } from '../../shared/dataScope.js';

const router = Router();

// POST /api/exports/project/:projectId/pdf — Generate project PDF
router.post(
  '/project/:projectId/pdf',
  authenticate,
  authorize(['PM', 'BU_HEAD', 'CFO']),
  asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params.projectId as string, 10);
    const result = await exportService.generateProjectPdf(projectId, req.user! as AuthUser);
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.buffer);
  }),
);

// POST /api/exports/project/:projectId/excel — Generate project Excel
router.post(
  '/project/:projectId/excel',
  authenticate,
  authorize(['PM', 'BU_HEAD', 'CFO']),
  asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params.projectId as string, 10);
    const result = await exportService.generateProjectExcel(projectId, req.user! as AuthUser);
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.buffer);
  }),
);

// POST /api/exports/portfolio/pdf — Generate portfolio PDF (BU_HEAD/CFO only)
router.post(
  '/portfolio/pdf',
  authenticate,
  authorize(['BU_HEAD', 'CFO']),
  asyncHandler(async (req, res) => {
    const result = await exportService.generatePortfolioPdf(req.user! as AuthUser);
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.buffer);
  }),
);

// POST /api/exports/portfolio/excel — Generate portfolio Excel (BU_HEAD/CFO only)
router.post(
  '/portfolio/excel',
  authenticate,
  authorize(['BU_HEAD', 'CFO']),
  asyncHandler(async (req, res) => {
    const result = await exportService.generatePortfolioExcel(req.user! as AuthUser);
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.buffer);
  }),
);

export default router;
