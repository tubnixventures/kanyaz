import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { CreateCommentSchema, CommendActionSchema } from '../../schema/discussion.schema.ts';
import { DiscussionService } from '../../services/discussion.service.ts';
import { EncryptionService } from '../../services/encryption.service.ts';
import { BlockchainLedgerService } from '../../services/blockchain-ledger.service.ts';
import { successResponse, errorResponse } from '../../utils/response.ts';

export const discussionsRouter = new Hono();

discussionsRouter.post('/', zValidator('json', CreateCommentSchema), (c) => {
  const body = c.req.valid('json');
  const authorId = c.req.header('x-user-id') || 'anonymous_participant';
  const authorName = c.req.header('x-user-name') || 'Citizen';

  const comment = DiscussionService.postComment({
    targetId: `${body.targetType}_${body.targetId}`,
    authorId,
    authorName,
    content: body.content,
    parentId: body.parentId,
    isEncrypted: body.isEncrypted,
  });

  return c.json(successResponse(comment), 201);
});

discussionsRouter.get('/', (c) => {
  const targetType = c.req.query('targetType') || 'election';
  const targetId = c.req.query('targetId') || '';
  const parentId = c.req.query('parentId') || null;

  const comments = DiscussionService.getDiscussionTree(`${targetType}_${targetId}`, parentId);
  return c.json(successResponse(comments));
});

discussionsRouter.post('/commend', zValidator('json', CommendActionSchema), (c) => {
  const { commentId } = c.req.valid('json');
  const targetId = c.req.query('targetId') || '';
  try {
    const updatedCount = DiscussionService.commend(targetId, commentId);
    return c.json(successResponse({ commentId, commendCount: updatedCount }));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Comment not found';
    return c.json(errorResponse('NOT_FOUND', message), 404);
  }
});

discussionsRouter.get('/blockchain/audit', (c) => {
  const summary = BlockchainLedgerService.getChainSummary();
  return c.json(successResponse(summary));
});

discussionsRouter.post('/decrypt', async (c) => {
  const { payload } = await c.req.json<{ payload: string }>();
  try {
    const decrypted = EncryptionService.decrypt(payload);
    return c.json(successResponse({ decrypted }));
  } catch {
    return c.json(errorResponse('DECRYPT_FAILED', 'Unable to decrypt message payload'), 400);
  }
});
