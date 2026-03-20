/**
 * Scope Creep routes (PRT-40 / PRT-66).
 * Mounted at /api/projects/:id/scope-creep in index.ts.
 */
import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { asyncHandler } from '../../shared/asyncHandler.js';
import type { AuthUser } from '../../shared/dataScope.js';
import { createScopeCreepSchema, updateScopeCreepSchema } from './validation.js';
import * as scopeCreepService from './service.js';

const router = Router({ mergeParams: true });

// GET /api/projects/:id/scope-creep
router.get(
  '/',
  authenticate,
  authorize(['PM', 'BU_HEAD', 'CFO']),
  asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params['id'] as string, 10);
    const result = await scopeCreepService.listScopeCreep(
      projectId,
      req.user! as AuthUser,
    );
    res.json(result);
  }),
);

// POST /api/projects/:id/scope-creep
router.post(
  '/',
  authenticate,
  authorize(['PM']),
  validateRequest(createScopeCreepSchema),
  asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params['id'] as string, 10);
    const result = await scopeCreepService.createScopeCreep(
      projectId,
      req.body,
      req.user! as AuthUser,
    );
    res.status(201).json(result);
  }),
);

// PUT /api/projects/:id/scope-creep/:entryId
router.put(
  '/:entryId',
  authenticate,
  authorize(['PM']),
  validateRequest(updateScopeCreepSchema),
  asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params['id'] as string, 10);
    const entryId = parseInt(req.params['entryId'] as string, 10);
    const result = await scopeCreepService.updateScopeCreep(
      projectId,
      entryId,
      req.body,
      req.user! as AuthUser,
    );
    res.json(result);
  }),
);

// DELETE /api/projects/:id/scope-creep/:entryId
router.delete(
  '/:entryId',
  authenticate,
  authorize(['PM']),
  asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params['id'] as string, 10);
    const entryId = parseInt(req.params['entryId'] as string, 10);
    await scopeCreepService.deleteScopeCreep(
      projectId,
      entryId,
      req.user! as AuthUser,
    );
    res.status(204).send();
  }),
);

export default router;
