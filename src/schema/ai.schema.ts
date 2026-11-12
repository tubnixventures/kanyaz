import { z } from 'zod';

export const TranslateSchema = z.object({
  text: z.string().min(1).max(5000),
  sourceLang: z.string().default('en'),
  targetLang: z.string().min(2).max(10),
});

export const SummarizeDebateSchema = z.object({
  debateId: z.string().min(1),
  discussionPoints: z.array(z.string()).min(1),
  maxTokens: z.number().int().min(50).max(1000).default(300),
});

export const ModerateContentSchema = z.object({
  content: z.string().min(1).max(3000),
});

export type TranslateInput = z.infer<typeof TranslateSchema>;
export type SummarizeDebateInput = z.infer<typeof SummarizeDebateSchema>;
export type ModerateContentInput = z.infer<typeof ModerateContentSchema>;
