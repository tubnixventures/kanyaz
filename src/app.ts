import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { authRouter } from './endpoints/auth/auth.router.ts';
import { electionsRouter } from './endpoints/elections/elections.router.ts';
import { votesRouter } from './endpoints/votes/votes.router.ts';
import { debatesRouter } from './endpoints/debates/debates.router.ts';
import { factChecksRouter } from './endpoints/debates/fact-checks.router.ts';
import { discussionsRouter } from './endpoints/discussions/discussions.router.ts';
import { healthRouter } from './endpoints/system/health.router.ts';
import { errorResponse, successResponse } from './utils/response.ts';
import { AppError } from './utils/errors.ts';

import { aiRouter } from './endpoints/ai/ai.router.ts';
import { examsRouter } from './endpoints/exams/exams.router.ts';
import { markingRouter } from './endpoints/exams/marking.router.ts';
import { moderationRouter } from './endpoints/exams/moderation.router.ts';
import { institutionsRouter } from './endpoints/institutions/institutions.router.ts';
import { unitsRouter } from './endpoints/units/units.router.ts';

export const app = new Hono();

app.use('*', cors());
app.use('*', logger());

app.onError((err, c) => {
  if (err instanceof AppError) {
    return c.json(errorResponse(err.code, err.message, err.details), err.statusCode as 400);
  }
  return c.json(errorResponse('INTERNAL_SERVER_ERROR', err.message || 'An unexpected error occurred'), 500);
});

app.get('/', (c) => {
  return c.json(
    successResponse({
      name: 'lively-backend',
      tagline: 'High-concurrency voting, polling, debate, and realtime anti-theft educational exams',
      version: '1.1.0',
      runtime: 'Hono + Cloudflare Workers / Durable Objects architecture',
      docs: '/api/v1/system/routes',
    })
  );
});

app.route('/api/v1/auth', authRouter);
app.route('/api/v1/elections', electionsRouter);
app.route('/api/v1/votes', votesRouter);
app.route('/api/v1/debates', debatesRouter);
app.route('/api/v1/debates', factChecksRouter);
app.route('/api/v1/discussions', discussionsRouter);
app.route('/api/v1/ai', aiRouter);
app.route('/api/v1/exams', examsRouter);
app.route('/api/v1/exams', markingRouter);
app.route('/api/v1/exams', moderationRouter);
app.route('/api/v1/institutions', institutionsRouter);
app.route('/api/v1/units', unitsRouter);
app.route('/api/v1/system', healthRouter);
