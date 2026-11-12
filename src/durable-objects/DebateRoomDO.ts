import { DebateRole } from '../schema/debate.schema.ts';
import { ForbiddenError } from '../utils/errors.ts';

export class DebateRoomDO {
  public debateId: string;
  public speakerId: string;
  public activeRoles: Partial<Record<DebateRole, string>> = {};
  public currentlySpeaking = new Set<string>();
  public handRaiseQueue: { userId: string; raisedAt: number }[] = [];
  public currentSlideState = { slideUrl: '', currentSlide: 1, totalSlides: 1 };
  public commendCount = 0;

  constructor(debateId: string, speakerId: string) {
    this.debateId = debateId;
    this.speakerId = speakerId;
    this.activeRoles.speaker = speakerId;
  }

  assignRole(requesterId: string, targetUserId: string, role: DebateRole) {
    if (requesterId !== this.speakerId) throw new ForbiddenError('Only the Speaker can assign debate roles');
    this.activeRoles[role] = targetUserId;
    this.handRaiseQueue = this.handRaiseQueue.filter((h) => h.userId !== targetUserId);
    return this.activeRoles;
  }

  setSpeakingStatus(requesterId: string, targetUserId: string, canSpeak: boolean) {
    if (requesterId !== this.speakerId) throw new ForbiddenError('Only the Speaker controls floor microphone');
    if (canSpeak) {
      if (this.currentlySpeaking.size >= 2) throw new ForbiddenError('Floor limit reached: only 2 can speak at once');
      this.currentlySpeaking.add(targetUserId);
    } else {
      this.currentlySpeaking.delete(targetUserId);
    }
    return Array.from(this.currentlySpeaking);
  }

  raiseHand(userId: string) {
    if (!this.handRaiseQueue.some((h) => h.userId === userId)) {
      this.handRaiseQueue.push({ userId, raisedAt: Date.now() });
    }
    return this.handRaiseQueue;
  }

  syncSlides(requesterId: string, state: { slideUrl: string; currentSlide: number; totalSlides: number }) {
    const isPresenter = requesterId === this.speakerId || requesterId === this.activeRoles.proposer;
    if (!isPresenter) throw new ForbiddenError('Only Speaker or active Proposer can control slides');
    this.currentSlideState = state;
    return this.currentSlideState;
  }

  commendDebate() {
    this.commendCount += 1;
    return this.commendCount;
  }
}
