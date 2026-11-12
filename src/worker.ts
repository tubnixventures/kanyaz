import { app } from './app.ts';
import { DebateRoomDO } from './durable-objects/DebateRoomDO.ts';
import { ElectionTallyDO } from './durable-objects/ElectionTallyDO.ts';
import { DiscussionDO } from './durable-objects/DiscussionDO.ts';
import { RateLimiterDO } from './durable-objects/RateLimiterDO.ts';
import { ExamSessionDO } from './durable-objects/ExamSessionDO.ts';

// Cloudflare Workers module syntax export with Durable Object bindings
export { DebateRoomDO, ElectionTallyDO, DiscussionDO, RateLimiterDO, ExamSessionDO };

export default {
  fetch: app.fetch,
};
