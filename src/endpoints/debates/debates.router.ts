import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { CreateDebateSchema, AssignRoleSchema, SpeakPermissionSchema, SlideSyncSchema } from '../../schema/debate.schema.ts';
import { DebateService } from '../../services/debate.service.ts';
import { DebateAccessService } from '../../services/debate-access.service.ts';
import { successResponse, errorResponse } from '../../utils/response.ts';

export const debatesRouter = new Hono();

debatesRouter.post('/', zValidator('json', CreateDebateSchema), async (c) => {
  const body = c.req.valid('json');
  const speakerId = c.req.header('x-user-id') || 'speaker_default';
  const debate = await DebateService.createDebate(body, speakerId);
  return c.json(successResponse(debate), 201);
});

debatesRouter.get('/', (c) => {
  return c.json(successResponse(DebateService.listDebates()));
});

debatesRouter.get('/:id', (c) => {
  const id = c.req.param('id');
  const debate = DebateService.getDebate(id);
  const roomDO = DebateService.getRoomDO(id);
  if (!debate || !roomDO) return c.json(errorResponse('NOT_FOUND', 'Debate not found'), 404);

  const userId = c.req.header('x-user-id') || 'guest_viewer';
  const userRegion = c.req.header('x-user-region') || undefined;
  DebateAccessService.verifyAccess(debate, userId, userRegion);

  return c.json(successResponse({
    ...debate,
    activeRoles: roomDO.activeRoles,
    currentlySpeaking: Array.from(roomDO.currentlySpeaking),
    handRaiseQueue: roomDO.handRaiseQueue,
    slides: roomDO.currentSlideState,
    commendations: roomDO.commendCount,
  }));
});

debatesRouter.post('/:id/roles', zValidator('json', AssignRoleSchema), (c) => {
  const id = c.req.param('id');
  const roomDO = DebateService.getRoomDO(id);
  if (!roomDO) return c.json(errorResponse('NOT_FOUND', 'Debate not found'), 404);

  const speakerId = c.req.header('x-user-id') || roomDO.speakerId;
  const { targetUserId, role } = c.req.valid('json');
  const updatedRoles = roomDO.assignRole(speakerId, targetUserId, role);
  return c.json(successResponse({ activeRoles: updatedRoles }));
});

debatesRouter.post('/:id/floor', zValidator('json', SpeakPermissionSchema), (c) => {
  const id = c.req.param('id');
  const roomDO = DebateService.getRoomDO(id);
  if (!roomDO) return c.json(errorResponse('NOT_FOUND', 'Debate not found'), 404);

  const speakerId = c.req.header('x-user-id') || roomDO.speakerId;
  const { targetUserId, canSpeak } = c.req.valid('json');
  const speakers = roomDO.setSpeakingStatus(speakerId, targetUserId, canSpeak);
  return c.json(successResponse({ currentlySpeaking: speakers }));
});

debatesRouter.post('/:id/raise-hand', (c) => {
  const id = c.req.param('id');
  const roomDO = DebateService.getRoomDO(id);
  if (!roomDO) return c.json(errorResponse('NOT_FOUND', 'Debate not found'), 404);

  const userId = c.req.header('x-user-id') || `viewer_${Date.now()}`;
  const queue = roomDO.raiseHand(userId);
  return c.json(successResponse({ queuePosition: queue.length, queue }));
});

debatesRouter.post('/:id/slides', zValidator('json', SlideSyncSchema), (c) => {
  const id = c.req.param('id');
  const roomDO = DebateService.getRoomDO(id);
  if (!roomDO) return c.json(errorResponse('NOT_FOUND', 'Debate not found'), 404);

  const presenterId = c.req.header('x-user-id') || roomDO.speakerId;
  const slides = roomDO.syncSlides(presenterId, c.req.valid('json'));
  return c.json(successResponse({ slides }));
});

debatesRouter.post('/:id/commend', (c) => {
  const id = c.req.param('id');
  const roomDO = DebateService.getRoomDO(id);
  if (!roomDO) return c.json(errorResponse('NOT_FOUND', 'Debate not found'), 404);

  const count = roomDO.commendDebate();
  return c.json(successResponse({ commendations: count }));
});
