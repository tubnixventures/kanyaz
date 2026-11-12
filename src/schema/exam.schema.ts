import { z } from 'zod';

export const ExamQuestionSchema = z.object({
  id: z.string().min(1),
  prompt: z.string().min(3).max(2000),
  options: z.array(z.string()).min(2).max(10),
  correctOptionIndex: z.number().int().min(0),
  timeLimitSeconds: z.number().int().min(10).max(3600).default(60),
  maxPoints: z.number().positive().default(1),
});

export const CreateExamSchema = z.object({
  title: z.string().min(3).max(200),
  courseCode: z.string().min(2).max(50),
  unitCode: z.string().min(2).max(50).default('MED_301'),
  institution: z.string().min(2).max(100),
  institutionCode: z.string().min(2).max(50).default('kmtc'),
  branchCode: z.string().optional(),
  startsAt: z.string().datetime().default('2026-01-01T00:00:00.000Z'),
  endsAt: z.string().datetime().default('2026-12-31T23:59:59.000Z'),
  invigilatorId: z.string().min(1),
  isStrictOrder: z.boolean().default(true),
  allowedCandidateIds: z.array(z.string()).default([]),
  questions: z.array(ExamQuestionSchema).min(1, 'At least 1 question is required'),
});

export const InvigilatorActionSchema = z.object({
  action: z.enum(['next', 'back', 'lock', 'pause', 'resume', 'jump', 'terminate_student']),
  targetQuestionIndex: z.number().int().min(0).optional(),
  targetStudentId: z.string().optional(),
});

export const SubmitAnswerSchema = z.object({
  studentId: z.string().min(1),
  questionId: z.string().min(1),
  selectedOptionIndex: z.number().int().min(0),
  clientTimeRemaining: z.number().optional(),
});

export const AntiCheatIncidentSchema = z.object({
  studentId: z.string().min(1),
  incidentType: z.enum(['tab_switch', 'window_blur', 'fullscreen_exit', 'paste_attempt', 'multiple_displays']),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CreateExamInput = z.infer<typeof CreateExamSchema>;
export type ExamQuestion = z.infer<typeof ExamQuestionSchema>;
export type InvigilatorActionInput = z.infer<typeof InvigilatorActionSchema>;
export type SubmitAnswerInput = z.infer<typeof SubmitAnswerSchema>;
export type AntiCheatIncidentInput = z.infer<typeof AntiCheatIncidentSchema>;
