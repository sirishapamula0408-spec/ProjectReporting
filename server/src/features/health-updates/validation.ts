import { z } from 'zod';

export const createHealthUpdateSchema = z.object({
  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Must be YYYY-MM format'),
  achievements: z.array(z.string().min(1)).default([]),
  challenges: z.array(z.string().min(1)).default([]),
  clientSatisfactionRag: z.enum(['RED', 'AMBER', 'GREEN']),
  clientSatisfactionNote: z.string().max(500).optional().nullable(),
  escalationCount: z.number().int().min(0).optional().nullable(),
  changeRequestVolume: z.number().int().min(0).optional().nullable(),
  avgResponseTimeDays: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal amount')
    .optional()
    .nullable(),
});

export const updateHealthUpdateSchema = createHealthUpdateSchema.partial();

export type CreateHealthUpdateInput = z.infer<typeof createHealthUpdateSchema>;
export type UpdateHealthUpdateInput = z.infer<typeof updateHealthUpdateSchema>;
