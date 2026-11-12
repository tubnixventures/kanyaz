import { z } from 'zod';

export const AiGradingSchema = z.object({
  studentId: z.string().min(1),
  questionId: z.string().min(1),
  studentAnswer: z.string().min(1),
  rubric: z.string().min(5).max(1000),
  maxPoints: z.number().positive(),
});

export const ManualGradingSchema = z.object({
  studentId: z.string().min(1),
  questionId: z.string().min(1),
  awardedPoints: z.number().min(0),
  examinerNotes: z.string().max(1000).optional(),
});

export const CancelExamCandidateSchema = z.object({
  studentId: z.string().min(1),
  malpracticeReason: z.string().min(5).max(500),
  evidenceDetails: z.record(z.string(), z.unknown()).optional(),
});

export const KioskTelemetrySchema = z.object({
  studentId: z.string().min(1),
  kioskEnforced: z.boolean().default(true),
  gazeDeviationDetected: z.boolean().default(false),
  multipleFacesDetected: z.boolean().default(false),
  audioAnomalyDetected: z.boolean().default(false),
  activeDisplayCount: z.number().int().default(1),
});

export type AiGradingInput = z.infer<typeof AiGradingSchema>;
export type ManualGradingInput = z.infer<typeof ManualGradingSchema>;
export type CancelExamCandidateInput = z.infer<typeof CancelExamCandidateSchema>;
export type KioskTelemetryInput = z.infer<typeof KioskTelemetrySchema>;
