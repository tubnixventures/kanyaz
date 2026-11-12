import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { FactCheckClaimSchema } from '../../schema/debate.schema.ts';
import { FactCheckService } from '../../services/fact-check.service.ts';
import { successResponse } from '../../utils/response.ts';

export const factChecksRouter = new Hono();

factChecksRouter.post('/:debateId/claims', zValidator('json', FactCheckClaimSchema), (c) => {
  const debateId = c.req.param('debateId');
  const body = c.req.valid('json');
  const claim = FactCheckService.submitFactCheck({
    debateId,
    speakerUserId: body.speakerUserId,
    claimStatement: body.claimStatement,
    verdict: body.verdict,
    citationSources: body.citationSources,
  });

  return c.json(successResponse(claim), 201);
});

factChecksRouter.get('/:debateId/claims', (c) => {
  const debateId = c.req.param('debateId');
  const claims = FactCheckService.getDebateClaims(debateId);
  return c.json(successResponse(claims));
});

factChecksRouter.get('/voter-history/:userId', (c) => {
  const userId = c.req.param('userId');
  const history = FactCheckService.getVoterCivicHistory(userId);
  return c.json(successResponse({ userId, records: history }));
});
