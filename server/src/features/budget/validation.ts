import { z } from 'zod';

const costCategoryTypeEnum = z.enum([
  'EMPLOYEE_SALARY',
  'SUBSCRIPTIONS',
  'TRAVEL',
  'ACCOMMODATION',
  'FOOD_ALLOWANCE',
  'GIFTS',
  'INFRASTRUCTURE',
  'CONTRACTOR',
]);

export const saveBudgetPlanSchema = z.object({
  items: z.array(
    z.object({
      categoryType: costCategoryTypeEnum,
      period: z.string().regex(/^\d{4}-\d{2}$/, 'Must be YYYY-MM format'),
      amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal amount'),
    }),
  ).min(1, 'At least one budget item is required'),
});

export type SaveBudgetPlanInput = z.infer<typeof saveBudgetPlanSchema>;
