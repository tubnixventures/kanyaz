import { z } from 'zod';

export const DebateRoleEnum = z.enum([
  'speaker',
  'secretary',
  'proposer',
  'opponent',
  'chief_whip',
]);

export const CreateDebateSchema = z.object({
  topic: z.string().min(5).max(300),
  description: z.string().max(2000).optional(),
  isPrivate: z.boolean().default(false),
  passcode: z.string().min(4).optional(),
  isInviteOnly: z.boolean().default(false),
  invitedUserIds: z.array(z.string()).default([]),
  allowedRegions: z.array(z.string()).default([]),
  scheduledStart: z.string().datetime().optional(),
  organizationId: z.string().optional(),
});

export const AssignRoleSchema = z.object({
  targetUserId: z.string().min(1),
  role: DebateRoleEnum,
});

export const SpeakPermissionSchema = z.object({
  targetUserId: z.string().min(1),
  canSpeak: z.boolean(),
});

export const SlideSyncSchema = z.object({
  slideUrl: z.string().url(),
  currentSlide: z.number().int().min(1),
  totalSlides: z.number().int().min(1),
});

export const FactCheckClaimSchema = z.object({
  speakerUserId: z.string().min(1),
  claimStatement: z.string().min(5).max(1000),
  verdict: z.enum(['true', 'mostly_true', 'misleading', 'false', 'unverified']),
  citationSources: z.array(z.string().url()).max(5),
});

export type DebateRole = z.infer<typeof DebateRoleEnum>;
export type CreateDebateInput = z.infer<typeof CreateDebateSchema>;
export type AssignRoleInput = z.infer<typeof AssignRoleSchema>;
export type SlideSyncInput = z.infer<typeof SlideSyncSchema>;
