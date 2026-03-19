import { Router } from 'express';
import { authenticate, authorize, validateRequest } from '../../middleware/index.js';
import { asyncHandler } from '../../shared/asyncHandler.js';
import { createAllocationSchema, updateAllocationSchema } from './validation.js';
import * as allocationService from './service.js';
import type { AuthUser } from '../../shared/dataScope.js';

// Project allocations: /api/projects/:id/allocations
export const projectAllocationRouter = Router({ mergeParams: true });

projectAllocationRouter.get('/', authenticate, authorize(['PM', 'BU_HEAD', 'CFO']),
  asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params.id!, 10);
    const result = await allocationService.listAllocations(projectId, req.user! as AuthUser);
    res.json(result);
  }),
);

projectAllocationRouter.post('/', authenticate, authorize(['PM']), validateRequest(createAllocationSchema),
  asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params.id!, 10);
    const result = await allocationService.createAllocation(projectId, req.body, req.user! as AuthUser);
    res.status(201).json(result);
  }),
);

projectAllocationRouter.put('/:allocationId', authenticate, authorize(['PM']), validateRequest(updateAllocationSchema),
  asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params.id!, 10);
    const allocationId = parseInt(req.params.allocationId!, 10);
    const result = await allocationService.updateAllocation(projectId, allocationId, req.body, req.user! as AuthUser);
    res.json(result);
  }),
);

projectAllocationRouter.delete('/:allocationId', authenticate, authorize(['PM']),
  asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params.id!, 10);
    const allocationId = parseInt(req.params.allocationId!, 10);
    const result = await allocationService.deleteAllocation(projectId, allocationId, req.user! as AuthUser);
    res.json(result);
  }),
);

// Cross-project view: /api/team-members/:id/allocations (FR11)
export const memberAllocationRouter = Router({ mergeParams: true });

memberAllocationRouter.get('/', authenticate, authorize(['PM', 'BU_HEAD', 'CFO']),
  asyncHandler(async (req, res) => {
    const teamMemberId = parseInt(req.params.id!, 10);
    const result = await allocationService.getMemberAllocations(teamMemberId);
    res.json(result);
  }),
);
