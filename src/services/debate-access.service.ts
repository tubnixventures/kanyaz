import { ForbiddenError } from '../utils/errors.ts';
import { DebateSessionRecord } from './debate.service.ts';

export class DebateAccessService {
  static verifyAccess(debate: DebateSessionRecord, userId: string, userRegion?: string): void {
    if (userId === debate.speakerId) return;

    if (debate.isInviteOnly) {
      const isInvited = debate.invitedUserIds && debate.invitedUserIds.includes(userId);
      if (!isInvited) {
        throw new ForbiddenError('Access Denied: This debate room is strictly invite-only');
      }
    }

    if (debate.allowedRegions && debate.allowedRegions.length > 0) {
      const match = userRegion && debate.allowedRegions.some(
        (r) => r.toLowerCase() === userRegion.toLowerCase()
      );
      if (!match) {
        throw new ForbiddenError(
          `Geographic Restriction: This debate is only open to participants in: ${debate.allowedRegions.join(', ')}`
        );
      }
    }
  }
}
