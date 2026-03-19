import { z } from 'zod';

export const createMilestoneSchema = z.object({
  name: z.string().min(1, 'Milestone name is required').max(200),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal amount'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
});

export const updateMilestoneSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  isPaid: z.boolean().optional(),
  paidDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
});

export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;
export type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>;
