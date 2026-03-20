import { z } from 'zod';

export const createReviewNoteSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/, 'Must be YYYY-MM format'),
  note: z.string().min(1, 'Note is required').max(2000, 'Note must be 2000 characters or less'),
  decision: z.enum(['Approved', 'Needs Revision', 'Acknowledged']).optional(),
});

export type CreateReviewNoteInput = z.infer<typeof createReviewNoteSchema>;
