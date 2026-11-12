import { z } from 'zod';

export const GeoLocationSchema = z.object({
  country: z.string().min(2),
  county: z.string().optional(),
  constituency: z.string().optional(),
  ward: z.string().optional(),
  region: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radiusMeters: z.number().positive().default(50000),
});

export const ElectionOptionSchema = z.object({
  id: z.string().uuid().or(z.string().min(1)),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  candidateName: z.string().optional(),
  partyAffiliation: z.string().optional(),
});

export const CreateElectionSchema = z.object({
  title: z.string().min(3).max(250),
  description: z.string().max(2000).optional(),
  electionType: z.enum(['secret', 'open_anonymous', 'accountable_audited']),
  scope: z.enum(['public', 'bank', 'sacco', 'cooperative', 'institution']),
  geoTracking: GeoLocationSchema,
  options: z.array(ElectionOptionSchema).min(2, 'At least 2 options are required'),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  allowedRegions: z.array(z.string()).default([]),
  requireOtpVerification: z.boolean().default(false),
  allowFingerprintBypass: z.boolean().default(false),
});

export type CreateElectionInput = z.infer<typeof CreateElectionSchema>;
export type GeoLocationInput = z.infer<typeof GeoLocationSchema>;
export type ElectionOptionInput = z.infer<typeof ElectionOptionSchema>;
