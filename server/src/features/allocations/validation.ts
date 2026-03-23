import { z } from 'zod';

export const createAllocationSchema = z.object({
  teamMemberId: z.number().int().positive('Team member ID is required'),
  allocationPct: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal percentage'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format').optional(),
});

export const updateAllocationSchema = z.object({
  allocationPct: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
});

export type CreateAllocationInput = z.infer<typeof createAllocationSchema>;
export type UpdateAllocationInput = z.infer<typeof updateAllocationSchema>;
