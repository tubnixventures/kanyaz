import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { CreateElectionSchema } from '../../schema/election.schema.ts';
import { ElectionService } from '../../services/election.service.ts';
import { AnalyticsQueue } from '../../queues/analytics.queue.ts';
import { successResponse, errorResponse } from '../../utils/response.ts';

export const electionsRouter = new Hono();

electionsRouter.post('/', zValidator('json', CreateElectionSchema), (c) => {
  const body = c.req.valid('json');
  const authHeader = c.req.header('Authorization');
  const creatorId = authHeader ? 'auth_user' : 'anonymous_organizer';

  const election = ElectionService.createElection(body, creatorId);
  return c.json(successResponse(election), 201);
});

electionsRouter.get('/', (c) => {
  const scope = c.req.query('scope');
  const country = c.req.query('country');
  const elections = ElectionService.listElections({ scope, country });
  return c.json(successResponse(elections));
});

electionsRouter.get('/:id', (c) => {
  const id = c.req.param('id');
  const election = ElectionService.getElection(id);
  if (!election) return c.json(errorResponse('NOT_FOUND', 'Election not found'), 404);
  return c.json(successResponse(election));
});

electionsRouter.get('/:id/mapping', (c) => {
  const id = c.req.param('id');
  const election = ElectionService.getElection(id);
  if (!election) return c.json(errorResponse('NOT_FOUND', 'Election not found'), 404);

  const geoAggregates = AnalyticsQueue.getAggregates(id);
  const mappingPayload = {
    electionId: id,
    center: {
      latitude: election.geoTracking.latitude,
      longitude: election.geoTracking.longitude,
      radiusMeters: election.geoTracking.radiusMeters,
      country: election.geoTracking.country,
      county: election.geoTracking.county,
      constituency: election.geoTracking.constituency,
      ward: election.geoTracking.ward,
      region: election.geoTracking.region,
    },
    regionalHeatmaps: geoAggregates,
  };

  return c.json(successResponse(mappingPayload));
});
