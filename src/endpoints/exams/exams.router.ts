import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { CreateExamSchema, InvigilatorActionSchema, SubmitAnswerSchema, AntiCheatIncidentSchema } from '../../schema/exam.schema.ts';
import { ExamService } from '../../services/exam.service.ts';
import { ExamAccessService } from '../../services/exam-access.service.ts';
import { successResponse, errorResponse } from '../../utils/response.ts';

export const examsRouter = new Hono();

examsRouter.post('/', zValidator('json', CreateExamSchema), (c) => {
  const body = c.req.valid('json');
  const exam = ExamService.createExam(body);
  return c.json(successResponse(exam), 201);
});

examsRouter.post('/:id/control', zValidator('json', InvigilatorActionSchema), (c) => {
  const id = c.req.param('id');
  const callerId = c.req.header('x-invigilator-id') || '';
  const sessionDO = ExamService.getSessionDO(id);
  if (!sessionDO) return c.json(errorResponse('NOT_FOUND', 'Exam session not found'), 404);

  const { action, targetQuestionIndex, targetStudentId } = c.req.valid('json');
  const snapshot = sessionDO.handleInvigilatorControl(callerId, action, targetQuestionIndex, targetStudentId);
  return c.json(successResponse(snapshot));
});

examsRouter.post('/:id/join', (c) => {
  const id = c.req.param('id');
  const studentId = c.req.header('x-student-id') || `std_${Date.now()}`;
  const exam = ExamService.getExam(id);
  const sessionDO = ExamService.getSessionDO(id);
  if (!exam || !sessionDO) return c.json(errorResponse('NOT_FOUND', 'Exam session not found'), 404);

  ExamAccessService.validateCandidateAccess(exam, studentId);
  const joinInfo = sessionDO.joinStudent(studentId);
  return c.json(successResponse({ studentId, ...joinInfo }));
});

examsRouter.get('/:id/active-question', (c) => {
  const id = c.req.param('id');
  const studentId = c.req.header('x-student-id') || '';
  const sessionDO = ExamService.getSessionDO(id);
  if (!sessionDO) return c.json(errorResponse('NOT_FOUND', 'Exam session not found'), 404);

  const question = sessionDO.getActiveQuestionForStudent(studentId);
  return c.json(successResponse(question));
});

examsRouter.post('/:id/submit', zValidator('json', SubmitAnswerSchema), (c) => {
  const id = c.req.param('id');
  const exam = ExamService.getExam(id);
  const sessionDO = ExamService.getSessionDO(id);
  if (!exam || !sessionDO) return c.json(errorResponse('NOT_FOUND', 'Exam session not found'), 404);

  const { studentId, questionId, selectedOptionIndex } = c.req.valid('json');
  ExamAccessService.validateCandidateAccess(exam, studentId);
  const result = sessionDO.submitAnswer(studentId, questionId, selectedOptionIndex);
  return c.json(successResponse(result));
});

examsRouter.post('/:id/report-incident', zValidator('json', AntiCheatIncidentSchema), (c) => {
  const id = c.req.param('id');
  const sessionDO = ExamService.getSessionDO(id);
  if (!sessionDO) return c.json(errorResponse('NOT_FOUND', 'Exam session not found'), 404);

  const { studentId, incidentType } = c.req.valid('json');
  const report = sessionDO.recordIncident(studentId, incidentType);
  return c.json(successResponse(report));
});

examsRouter.get('/:id/invigilator-view', (c) => {
  const id = c.req.param('id');
  const sessionDO = ExamService.getSessionDO(id);
  if (!sessionDO) return c.json(errorResponse('NOT_FOUND', 'Exam session not found'), 404);

  return c.json(successResponse({
    state: sessionDO.getStateSnapshot(),
    students: Array.from(sessionDO.students.values()),
    incidentLogs: Object.fromEntries(sessionDO.securityIncidents),
  }));
});

examsRouter.get('/:id/results/:studentId', (c) => {
  const { id, studentId } = c.req.param();
  const score = ExamService.calculateScore(id, studentId);
  return c.json(successResponse(score));
});
