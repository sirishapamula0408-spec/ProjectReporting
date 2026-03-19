import { z } from 'zod';

export const createProjectSchema = z.object({
  code: z.string().min(1, 'Project code is required').max(20),
  name: z.string().min(1, 'Project name is required').max(200),
  client: z.string().min(1, 'Client name is required').max(200),
  contractValue: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal with up to 2 decimal places'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
  businessUnit: z.string().min(1, 'Business unit is required').max(100),
  description: z.string().max(2000).optional().nullable(),
});

export const updateProjectSchema = createProjectSchema.partial().omit({ code: true });

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
