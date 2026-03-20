import { z } from 'zod';

export const createScopeCreepSchema = z.object({
  description: z.string().min(1, 'Description is required').max(1000),
  effortHours: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal with up to 2 decimal places')
    .refine((v) => parseFloat(v) > 0, 'Must be positive')
    .refine((v) => parseFloat(v) <= 9999.99, 'Must not exceed 9999.99'),
  costImpact: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal with up to 2 decimal places')
    .refine((v) => parseFloat(v) > 0, 'Must be positive'),
  decision: z.enum(['ABSORBED', 'CHANGE_REQUEST', 'DECLINED']),
});

export const updateScopeCreepSchema = createScopeCreepSchema.partial();

export type CreateScopeCreepInput = z.infer<typeof createScopeCreepSchema>;
export type UpdateScopeCreepInput = z.infer<typeof updateScopeCreepSchema>;
