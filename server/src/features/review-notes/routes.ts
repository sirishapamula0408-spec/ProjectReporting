import { Router } from 'express';
import { authenticate, authorize, validateRequest } from '../../middleware/index.js';
import { asyncHandler } from '../../shared/asyncHandler.js';
import { createReviewNoteSchema } from './validation.js';
import * as reviewNoteService from './service.js';
import type { AuthUser } from '../../shared/dataScope.js';

const router = Router({ mergeParams: true });

// GET /api/projects/:id/review-notes — list review notes (all roles)
router.get(
  '/',
  authenticate,
  authorize(['PM', 'BU_HEAD', 'CFO']),
  asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params.id as string, 10);
    const result = await reviewNoteService.listReviewNotes(projectId, req.user! as AuthUser);
    res.json(result);
  }),
);

// POST /api/projects/:id/review-notes — create review note (BU_HEAD and CFO only)
router.post(
  '/',
  authenticate,
  authorize(['BU_HEAD', 'CFO']),
  validateRequest(createReviewNoteSchema),
  asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params.id as string, 10);
    const result = await reviewNoteService.createReviewNote(
      projectId,
      req.body,
      req.user! as AuthUser,
    );
    res.status(201).json(result);
  }),
);

export default router;
