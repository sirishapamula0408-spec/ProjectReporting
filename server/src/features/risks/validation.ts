import { z } from 'zod';

export const createRiskSchema = z.object({
  description: z.string().min(1, 'Description is required').max(500),
  probability: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  costImpact: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal amount'),
  mitigationPlan: z.string().max(1000).optional().nullable(),
});

export const updateRiskSchema = z.object({
  description: z.string().min(1).max(500).optional(),
  probability: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  costImpact: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  mitigationPlan: z.string().max(1000).optional().nullable(),
  status: z.enum(['OPEN', 'MITIGATED', 'CLOSED', 'MATERIALIZED']).optional(),
});

export const updateRiskStatusSchema = z.object({
  status: z.enum(['OPEN', 'MITIGATED', 'CLOSED', 'MATERIALIZED']),
});

export type CreateRiskInput = z.infer<typeof createRiskSchema>;
export type UpdateRiskInput = z.infer<typeof updateRiskSchema>;
export type UpdateRiskStatusInput = z.infer<typeof updateRiskStatusSchema>;
