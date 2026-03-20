import { z } from 'zod';

export const createTeamMemberSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  role: z.string().min(1, 'Role is required').max(100),
  department: z.string().min(1, 'Department is required').max(100),
  loadedCostRate: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal'),
  skills: z.array(z.string()).default([]),
});

export const updateTeamMemberSchema = createTeamMemberSchema.partial();

export type CreateTeamMemberInput = z.infer<typeof createTeamMemberSchema>;
export type UpdateTeamMemberInput = z.infer<typeof updateTeamMemberSchema>;
