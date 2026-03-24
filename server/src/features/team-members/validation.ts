import { z } from 'zod';

export const createTeamMemberSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  role: z.string().max(100).optional().default(''),
  department: z.string().max(100).optional().default(''),
  loadedCostRate: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').optional().default('0'),
  skills: z.array(z.string()).default([]),
});

export const updateTeamMemberSchema = createTeamMemberSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type CreateTeamMemberInput = z.infer<typeof createTeamMemberSchema>;
export type UpdateTeamMemberInput = z.infer<typeof updateTeamMemberSchema>;
