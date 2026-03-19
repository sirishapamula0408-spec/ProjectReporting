import { z } from 'zod';

export const createAllocationSchema = z.object({
  teamMemberId: z.number().int().positive(),
  allocationPct: z.string().regex(/^\d{1,3}(\.\d{1,2})?$/, 'Must be 0-100 with up to 2 decimals'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  onboardingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  offboardingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
});

export const updateAllocationSchema = createAllocationSchema.partial().omit({ teamMemberId: true });

export type CreateAllocationInput = z.infer<typeof createAllocationSchema>;
export type UpdateAllocationInput = z.infer<typeof updateAllocationSchema>;
