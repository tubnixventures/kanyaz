import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { AiGradingSchema, ManualGradingSchema, CancelExamCandidateSchema, KioskTelemetrySchema } from '../../schema/marking.schema.ts';
import { AiMarkingService } from '../../services/ai-marking.service.ts';
import { ExamScriptService } from '../../services/exam-script.service.ts';
import { ProctorStreamService } from '../../services/proctor-stream.service.ts';
import { ExamNotificationsQueue } from '../../queues/exam-notifications.queue.ts';
import { ModerationService } from '../../services/moderation.service.ts';
import { successResponse } from '../../utils/response.ts';

export const markingRouter = new Hono();

markingRouter.get('/:id/scripts', (c) => {
  const id = c.req.param('id');
  const scripts = ExamScriptService.downloadAllScripts(id);
  return c.json(successResponse({ examId: id, totalScripts: scripts.length, scripts }));
});

markingRouter.get('/:id/scripts/:studentId', (c) => {
  const { id, studentId } = c.req.param();
  const script = ExamScriptService.generateScript(id, studentId);
  return c.json(successResponse(script));
});

markingRouter.post('/:id/ai-grade', zValidator('json', AiGradingSchema), async (c) => {
  const body = c.req.valid('json');
  const result = await AiMarkingService.gradeAnswer(body);
  return c.json(successResponse(result));
});

markingRouter.post('/:id/manual-grade', zValidator('json', ManualGradingSchema), (c) => {
  const id = c.req.param('id');
  const { studentId, questionId, awardedPoints, examinerNotes } = c.req.valid('json');
  ExamScriptService.recordManualMark(id, studentId, questionId, awardedPoints, examinerNotes);
  return c.json(successResponse({ status: 'GRADED', studentId, questionId, awardedPoints }));
});

markingRouter.post('/:id/cancel-candidate', zValidator('json', CancelExamCandidateSchema), (c) => {
  const id = c.req.param('id');
  const { studentId, malpracticeReason } = c.req.valid('json');
  ExamScriptService.cancelCandidate(id, studentId, malpracticeReason);
  ProctorStreamService.markMalpractice(id, studentId);
  return c.json(successResponse({ status: 'CANCELLED_MALPRACTICE', studentId, malpracticeReason }));
});

markingRouter.post('/:id/candidate-stream', (c) => {
  const id = c.req.param('id');
  const studentId = c.req.header('x-student-id') || 'student_stream';
  const session = ProctorStreamService.registerCandidateStream(id, studentId);
  return c.json(successResponse(session));
});

markingRouter.post('/:id/telemetry', zValidator('json', KioskTelemetrySchema), (c) => {
  const id = c.req.param('id');
  const { studentId, gazeDeviationDetected, multipleFacesDetected, audioAnomalyDetected, kioskEnforced } = c.req.valid('json');
  const flags: string[] = [];
  if (!kioskEnforced) flags.push('KIOSK_VIOLATION');
  if (gazeDeviationDetected) flags.push('GAZE_DEVIATION');
  if (multipleFacesDetected) flags.push('MULTIPLE_FACES');
  if (audioAnomalyDetected) flags.push('AUDIO_ANOMALY');

  const session = ProctorStreamService.updateTelemetry(id, studentId, flags);
  return c.json(successResponse(session));
});

markingRouter.get('/:id/proctor-matrix', (c) => {
  const id = c.req.param('id');
  const streams = ProctorStreamService.getProctorMatrix(id);
  return c.json(successResponse({ examId: id, activeCandidateStreams: streams }));
});

markingRouter.post('/:id/finalize-marking', async (c) => {
  const id = c.req.param('id');
  const moderation = ModerationService.getModerationRecord(id);
  const scripts = moderation?.moderatedScripts || ExamScriptService.downloadAllScripts(id);
  const payloads = scripts.map((s) => ({
    examId: s.examId,
    examTitle: s.examTitle,
    studentId: s.studentId,
    studentEmail: `${s.studentId}@campus.edu`,
    studentName: s.studentId,
    totalScore: s.totalScore,
    totalMaxPoints: s.totalMaxPoints,
    percentage: Math.round((s.totalScore / (s.totalMaxPoints || 1)) * 100),
    status: s.status,
  }));

  const count = await ExamNotificationsQueue.enqueueBatch(payloads);
  return c.json(successResponse({ status: 'MARKING_FINALIZED_NOTIFICATIONS_DISPATCHED', isModerated: !!moderation, queuedNotifications: count }));
});
