import { z } from 'zod';

const periodRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
const decimalRegex = /^\d+(\.\d{1,2})?$/;

export const upsertPlannedAmountSchema = z.object({
  period: z.string().regex(periodRegex, 'Period must be YYYY-MM format'),
  amount: z.string().regex(decimalRegex, 'Amount must be a non-negative decimal with up to 2 decimal places'),
});

export const batchUpsertPlannedAmountsSchema = z.object({
  items: z.array(
    z.object({
      costCategoryId: z.number().int().positive(),
      period: z.string().regex(periodRegex, 'Period must be YYYY-MM format'),
      amount: z.string().regex(decimalRegex, 'Amount must be a non-negative decimal'),
    }),
  ).min(1, 'At least one item is required'),
});

export const createCostEntrySchema = z.object({
  costCategoryId: z.number().int().positive(),
  period: z.string().regex(periodRegex, 'Period must be YYYY-MM format'),
  actualAmount: z.string().regex(decimalRegex, 'Amount must be a non-negative decimal'),
  notes: z.string().max(500).optional(),
});

export const updateCostEntrySchema = z.object({
  actualAmount: z.string().regex(decimalRegex, 'Amount must be a non-negative decimal').optional(),
  notes: z.string().max(500).optional(),
  reason: z.string().max(500).optional(),
});

export const batchUpsertCostEntriesSchema = z.object({
  items: z.array(
    z.object({
      costCategoryId: z.number().int().positive(),
      period: z.string().regex(periodRegex, 'Period must be YYYY-MM format'),
      actualAmount: z.string().regex(decimalRegex, 'Amount must be a non-negative decimal'),
      notes: z.string().max(500).optional(),
    }),
  ).min(1, 'At least one item is required'),
});

export const periodQuerySchema = z.object({
  period: z.string().regex(periodRegex, 'Period must be YYYY-MM format').optional(),
});

export type UpsertPlannedAmountInput = z.infer<typeof upsertPlannedAmountSchema>;
export type BatchUpsertPlannedAmountsInput = z.infer<typeof batchUpsertPlannedAmountsSchema>;
export type CreateCostEntryInput = z.infer<typeof createCostEntrySchema>;
export type UpdateCostEntryInput = z.infer<typeof updateCostEntrySchema>;
export type BatchUpsertCostEntriesInput = z.infer<typeof batchUpsertCostEntriesSchema>;
