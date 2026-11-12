import { z } from 'zod';

export const ModerateExamResultsSchema = z.object({
  moderatorId: z.string().min(1),
  verdict: z.enum(['approved', 'rejected', 'curve_applied']),
  curveAdjustmentPercentage: z.number().min(-30).max(30).default(0),
  moderatorNotes: z.string().min(5).max(1000),
  complianceSignoff: z.boolean().refine((val) => val === true, {
    message: 'Examiner moderation requires explicit compliance sign-off',
  }),
  minPassScore: z.number().min(0).default(50),
});

export const QueryModerationSchema = z.object({
  examId: z.string().min(1),
});

export type ModerateExamResultsInput = z.infer<typeof ModerateExamResultsSchema>;
export type QueryModerationInput = z.infer<typeof QueryModerationSchema>;
