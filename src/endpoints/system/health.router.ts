import { Hono } from 'hono';
import { VoteAuditQueue } from '../../queues/vote-audit.queue.ts';
import { EmailDispatchQueue } from '../../queues/email-dispatch.queue.ts';
import { ExamNotificationsQueue } from '../../queues/exam-notifications.queue.ts';
import { BlockchainLedgerService } from '../../services/blockchain-ledger.service.ts';
import { successResponse } from '../../utils/response.ts';

export const healthRouter = new Hono();

healthRouter.get('/health', (c) => {
  return c.json(
    successResponse({
      service: 'lively-backend',
      status: 'healthy',
      uptimeSeconds: process.uptime(),
      memoryUsage: process.memoryUsage(),
      activeQueues: {
        voteAuditBuffer: VoteAuditQueue.getQueueSize(),
        emailDispatchPending: EmailDispatchQueue.getPendingCount(),
        examNotificationsPending: ExamNotificationsQueue.getPendingCount(),
      },
      blockchain: BlockchainLedgerService.getChainSummary(),
      timestamp: new Date().toISOString(),
    })
  );
});

healthRouter.get('/routes', (c) => {
  return c.json(
    successResponse({
      apiBase: '/api/v1',
      modules: {
        auth: ['POST /auth/register', 'POST /auth/login', 'POST /auth/verify-otp'],
        elections: ['POST /elections', 'GET /elections', 'GET /elections/:id', 'GET /elections/:id/mapping'],
        votes: ['POST /votes/cast', 'POST /votes/anonymous', 'GET /votes/results/:electionId', 'POST /votes/verify-receipt'],
        debates: ['POST /debates', 'GET /debates', 'GET /debates/:id', 'POST /debates/:id/roles', 'POST /debates/:id/floor', 'POST /debates/:id/raise-hand', 'POST /debates/:id/slides', 'POST /debates/:id/commend'],
        factChecks: ['POST /debates/:debateId/claims', 'GET /debates/:debateId/claims', 'GET /debates/voter-history/:userId'],
        discussions: ['POST /discussions', 'GET /discussions', 'POST /discussions/commend', 'GET /discussions/blockchain/audit', 'POST /discussions/decrypt'],
        ai: ['POST /ai/translate', 'POST /ai/summarize', 'POST /ai/moderate'],
        exams: [
          'POST /exams', 'POST /exams/:id/control', 'POST /exams/:id/join', 'GET /exams/:id/active-question',
          'POST /exams/:id/submit', 'POST /exams/:id/report-incident', 'GET /exams/:id/invigilator-view',
          'GET /exams/:id/scripts', 'GET /exams/:id/scripts/:studentId', 'POST /exams/:id/ai-grade',
          'POST /exams/:id/manual-grade', 'POST /exams/:id/cancel-candidate', 'POST /exams/:id/candidate-stream',
          'POST /exams/:id/telemetry', 'GET /exams/:id/proctor-matrix', 'GET /exams/:id/results/:studentId',
          'POST /exams/:id/moderate', 'GET /exams/:id/moderation', 'POST /exams/:id/finalize-marking',
        ],
        institutions: [
          'POST /institutions', 'POST /institutions/:code/branches', 'POST /institutions/:code/staff',
          'GET /institutions/:code', 'GET /institutions/:code/staff',
        ],
        units: [
          'POST /units', 'GET /units/institution/:code', 'POST /units/map-student',
          'POST /units/register', 'GET /units/student/:studentId',
        ],
      },
    })
  );
});
