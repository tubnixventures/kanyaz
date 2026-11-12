import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { CastVoteSchema, AnonymousVoteSchema, VerifyReceiptSchema } from '../../schema/vote.schema.ts';
import { ElectionService } from '../../services/election.service.ts';
import { FraudPreventionService } from '../../services/fraud-prevention.service.ts';
import { VoteAuditQueue } from '../../queues/vote-audit.queue.ts';
import { AnalyticsQueue } from '../../queues/analytics.queue.ts';
import { successResponse, errorResponse } from '../../utils/response.ts';

export const votesRouter = new Hono();

votesRouter.post('/cast', zValidator('json', CastVoteSchema), async (c) => {
  const body = c.req.valid('json');
  const clientIp = c.req.header('x-forwarded-for') || '127.0.0.1';
  const election = ElectionService.getElection(body.electionId);
  const tallyDO = ElectionService.getTallyDO(body.electionId);
  if (!election || !tallyDO) return c.json(errorResponse('NOT_FOUND', 'Election not found'), 404);

  const voterId = body.fingerprintHash;
  const voterRegion = body.ward || body.constituency || body.county || body.region || body.country;
  FraudPreventionService.validateVoterEligibility({
    electionId: body.electionId,
    voterIdentifier: voterId,
    clientIp,
    voterCoordinates: body.latitude && body.longitude ? { latitude: body.latitude, longitude: body.longitude } : undefined,
    electionCenter: election.geoTracking,
    maxRadiusMeters: election.geoTracking.radiusMeters,
    allowedRegions: election.allowedRegions,
    voterRegion,
  });

  const regionTag = voterRegion || election.geoTracking.country;
  const { receiptHash, auditToken, timestamp } = tallyDO.recordVote(body.optionId, voterId, regionTag);
  FraudPreventionService.markVoterCompleted(body.electionId, voterId);

  await VoteAuditQueue.enqueue({ electionId: body.electionId, receiptHash, timestamp });
  AnalyticsQueue.enqueue({ electionId: body.electionId, optionId: body.optionId, county: body.county, ward: body.ward });

  return c.json(successResponse({ receiptHash, auditToken, recordedAt: timestamp }));
});

votesRouter.post('/anonymous', zValidator('json', AnonymousVoteSchema), async (c) => {
  const body = c.req.valid('json');
  const clientIp = c.req.header('x-forwarded-for') || '127.0.0.1';
  const election = ElectionService.getElection(body.electionId);
  const tallyDO = ElectionService.getTallyDO(body.electionId);
  if (!election || !tallyDO) return c.json(errorResponse('NOT_FOUND', 'Election not found'), 404);

  const anonymousVoterKey = `anon_${body.deviceNonce}_${body.fingerprintHash}`;
  const voterRegion = body.region || body.ward || body.county || body.country;
  FraudPreventionService.validateVoterEligibility({
    electionId: body.electionId,
    voterIdentifier: anonymousVoterKey,
    clientIp,
    voterCoordinates: body.latitude && body.longitude ? { latitude: body.latitude, longitude: body.longitude } : undefined,
    electionCenter: election.geoTracking,
    maxRadiusMeters: election.geoTracking.radiusMeters,
    allowedRegions: election.allowedRegions,
    voterRegion,
  });

  const { receiptHash, auditToken, timestamp } = tallyDO.recordVote(body.optionId, anonymousVoterKey, body.region || 'Anonymous');
  FraudPreventionService.markVoterCompleted(body.electionId, anonymousVoterKey);
  await VoteAuditQueue.enqueue({ electionId: body.electionId, receiptHash, timestamp });

  return c.json(successResponse({ receiptHash, auditToken, anonymous: true }));
});

votesRouter.get('/results/:electionId', (c) => {
  const electionId = c.req.param('electionId');
  const tallyDO = ElectionService.getTallyDO(electionId);
  if (!tallyDO) return c.json(errorResponse('NOT_FOUND', 'Tally not found'), 404);
  const snapshot = tallyDO.getSnapshot();
  return c.json(successResponse({ electionId, totalVotes: snapshot.totalVotes, optionsTally: snapshot.optionsTally, regionalBreakdown: snapshot.regionalBreakdown }));
});

votesRouter.post('/verify-receipt', zValidator('json', VerifyReceiptSchema), (c) => {
  const { electionId, receiptHash } = c.req.valid('json');
  const tallyDO = ElectionService.getTallyDO(electionId);
  if (!tallyDO) return c.json(errorResponse('NOT_FOUND', 'Election not found'), 404);
  const isValid = tallyDO.verifyReceipt(receiptHash);
  return c.json(successResponse({ verified: isValid, receiptHash, status: isValid ? 'CONFIRMED_AUDITED' : 'NOT_FOUND' }));
});
