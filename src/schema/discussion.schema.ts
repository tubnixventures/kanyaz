import { z } from 'zod';

export const CreateCommentSchema = z.object({
  targetType: z.enum(['election', 'debate', 'topic']),
  targetId: z.string().min(1),
  parentId: z.string().nullable().optional(),
  content: z.string().min(1).max(3000),
  isEncrypted: z.boolean().default(false),
  encryptedPayload: z.string().optional(),
});

export const CommendActionSchema = z.object({
  commentId: z.string().min(1),
  commendType: z.enum(['praise', 'endorse', 'agreement', 'insightful']),
});

export const FilterDiscussionSchema = z.object({
  targetType: z.enum(['election', 'debate', 'topic']),
  targetId: z.string().min(1),
  parentId: z.string().nullable().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;
export type CommendActionInput = z.infer<typeof CommendActionSchema>;
export type FilterDiscussionInput = z.infer<typeof FilterDiscussionSchema>;
