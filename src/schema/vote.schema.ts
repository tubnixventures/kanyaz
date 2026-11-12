import { z } from 'zod';

export const CastVoteSchema = z.object({
  electionId: z.string().min(1),
  optionId: z.string().min(1),
  fingerprintHash: z.string().min(16),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  country: z.string().optional(),
  county: z.string().optional(),
  constituency: z.string().optional(),
  ward: z.string().optional(),
  region: z.string().optional(),
});

export const AnonymousVoteSchema = CastVoteSchema.extend({
  deviceNonce: z.string().min(10),
  captchaToken: z.string().optional(),
});

export const VerifyReceiptSchema = z.object({
  electionId: z.string().min(1),
  receiptHash: z.string().min(32),
});

export type CastVoteInput = z.infer<typeof CastVoteSchema>;
export type AnonymousVoteInput = z.infer<typeof AnonymousVoteSchema>;
export type VerifyReceiptInput = z.infer<typeof VerifyReceiptSchema>;
