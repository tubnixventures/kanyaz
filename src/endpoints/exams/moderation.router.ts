import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { ModerateExamResultsSchema } from '../../schema/moderation.schema.ts';
import { ModerationService } from '../../services/moderation.service.ts';
import { successResponse, errorResponse } from '../../utils/response.ts';

export const moderationRouter = new Hono();

moderationRouter.post('/:id/moderate', zValidator('json', ModerateExamResultsSchema), (c) => {
  const id = c.req.param('id');
  const body = c.req.valid('json');
  const record = ModerationService.moderateResults(id, body);
  return c.json(successResponse({
    status: 'RESULTS_MODERATED',
    examId: id,
    verdict: record.verdict,
    moderationHash: record.moderationHash,
    candidateCount: record.moderatedScripts.length,
    curveAdjustmentPercentage: record.curveAdjustmentPercentage,
  }));
});

moderationRouter.get('/:id/moderation', (c) => {
  const id = c.req.param('id');
  const record = ModerationService.getModerationRecord(id);
  if (!record) return c.json(errorResponse('NOT_FOUND', 'Exam results have not yet been submitted for committee moderation'), 404);
  return c.json(successResponse(record));
});
