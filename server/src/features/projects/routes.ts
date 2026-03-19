import { Router } from 'express';
import { authenticate, authorize, validateRequest } from '../../middleware/index.js';
import { asyncHandler } from '../../shared/asyncHandler.js';
import { createProjectSchema, updateProjectSchema } from './validation.js';
import * as projectService from './service.js';
import type { AuthUser } from '../../shared/dataScope.js';

const router = Router();

// GET /api/projects — list projects (filtered by role)
router.get(
  '/',
  authenticate,
  authorize(['PM', 'BU_HEAD', 'CFO']),
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page as string, 10) || 1;
    const pageSize = parseInt(req.query.pageSize as string, 10) || 20;
    const result = await projectService.listProjects(req.user! as AuthUser, page, pageSize);
    res.json(result);
  }),
);

// GET /api/projects/:id — get project detail
router.get(
  '/:id',
  authenticate,
  authorize(['PM', 'BU_HEAD', 'CFO']),
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id!, 10);
    const result = await projectService.getProjectById(id, req.user! as AuthUser);
    res.json(result);
  }),
);

// POST /api/projects — create project (PM only)
router.post(
  '/',
  authenticate,
  authorize(['PM']),
  validateRequest(createProjectSchema),
  asyncHandler(async (req, res) => {
    const result = await projectService.createProject(req.body, req.user! as AuthUser);
    res.status(201).json(result);
  }),
);

// PUT /api/projects/:id — update project (PM who manages only)
router.put(
  '/:id',
  authenticate,
  authorize(['PM']),
  validateRequest(updateProjectSchema),
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id!, 10);
    const result = await projectService.updateProject(id, req.body, req.user! as AuthUser);
    res.json(result);
  }),
);

export default router;
