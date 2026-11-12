import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { TranslateSchema, SummarizeDebateSchema, ModerateContentSchema } from '../../schema/ai.schema.ts';
import { CloudflareAiService } from '../../services/cloudflare-ai.service.ts';
import { successResponse } from '../../utils/response.ts';

export const aiRouter = new Hono();

aiRouter.post('/translate', zValidator('json', TranslateSchema), async (c) => {
  const { text, targetLang, sourceLang } = c.req.valid('json');
  const result = await CloudflareAiService.translateText(text, targetLang, sourceLang);
  return c.json(successResponse({ original: text, targetLang, ...result }));
});

aiRouter.post('/summarize', zValidator('json', SummarizeDebateSchema), async (c) => {
  const { debateId, discussionPoints } = c.req.valid('json');
  const result = await CloudflareAiService.summarizeDiscussion(discussionPoints);
  return c.json(successResponse({ debateId, ...result }));
});

aiRouter.post('/moderate', zValidator('json', ModerateContentSchema), async (c) => {
  const { content } = c.req.valid('json');
  const result = await CloudflareAiService.moderateSpeech(content);
  return c.json(successResponse(result));
});
