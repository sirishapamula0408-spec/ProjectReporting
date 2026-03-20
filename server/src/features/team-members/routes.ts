import { Router } from 'express';
import { authenticate, authorize, validateRequest } from '../../middleware/index.js';
import { asyncHandler } from '../../shared/asyncHandler.js';
import { createTeamMemberSchema, updateTeamMemberSchema } from './validation.js';
import * as teamMemberService from './service.js';

const router = Router();

// GET /api/team-members
router.get(
  '/',
  authenticate,
  authorize(['PM', 'BU_HEAD', 'CFO']),
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page as string, 10) || 1;
    const pageSize = parseInt(req.query.pageSize as string, 10) || 50;
    const result = await teamMemberService.listTeamMembers(page, pageSize);
    res.json(result);
  }),
);

// GET /api/team-members/:id
router.get(
  '/:id',
  authenticate,
  authorize(['PM', 'BU_HEAD', 'CFO']),
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id!, 10);
    const result = await teamMemberService.getTeamMemberById(id);
    res.json(result);
  }),
);

// POST /api/team-members
router.post(
  '/',
  authenticate,
  authorize(['PM']),
  validateRequest(createTeamMemberSchema),
  asyncHandler(async (req, res) => {
    const result = await teamMemberService.createTeamMember(req.body);
    res.status(201).json(result);
  }),
);

// PUT /api/team-members/:id
router.put(
  '/:id',
  authenticate,
  authorize(['PM']),
  validateRequest(updateTeamMemberSchema),
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id!, 10);
    const result = await teamMemberService.updateTeamMember(id, req.body);
    res.json(result);
  }),
);

export default router;
