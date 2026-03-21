import { z } from 'zod';

export const createHealthUpdateSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/, 'Must be YYYY-MM format'),
  achievements: z.array(z.string().max(500)).default([]),
  challenges: z.array(z.string().max(500)).default([]),
  clientSatisfactionRag: z.enum(['RED', 'AMBER', 'GREEN']),
  clientSatisfactionNote: z.string().max(2000).optional().nullable(),
  // Proxy satisfaction signals (FR23)
  escalationCount: z.number().int().min(0).max(999).optional().nullable(),
  changeRequestVolume: z.number().int().min(0).max(999).optional().nullable(),
  avgResponseTimeDays: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal')
    .refine((v) => parseFloat(v) >= 0 && parseFloat(v) <= 99.99, 'Must be 0-99.99')
    .optional()
    .nullable(),
});

export const updateHealthUpdateSchema = createHealthUpdateSchema.partial().omit({ period: true });

export type CreateHealthUpdateInput = z.infer<typeof createHealthUpdateSchema>;
export type UpdateHealthUpdateInput = z.infer<typeof updateHealthUpdateSchema>;
