import { CreateDebateInput } from '../schema/debate.schema.ts';
import { DebateRoomDO } from '../durable-objects/DebateRoomDO.ts';
import { CloudflareStreamService, LiveStreamSession } from './cloudflare-stream.service.ts';

export interface DebateSessionRecord extends CreateDebateInput {
  id: string;
  speakerId: string;
  createdAt: number;
  stream: LiveStreamSession;
}

export class DebateService {
  private static debates = new Map<string, DebateSessionRecord>();
  private static rooms = new Map<string, DebateRoomDO>();

  static async createDebate(input: CreateDebateInput, speakerId: string): Promise<DebateSessionRecord> {
    const id = `deb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const stream = await CloudflareStreamService.createLiveDebateBroadcast(id);
    const record: DebateSessionRecord = { ...input, id, speakerId, createdAt: Date.now(), stream };
    this.debates.set(id, record);

    const roomDO = new DebateRoomDO(id, speakerId);
    this.rooms.set(id, roomDO);

    return record;
  }

  static getDebate(id: string): DebateSessionRecord | null {
    return this.debates.get(id) || null;
  }

  static getRoomDO(id: string): DebateRoomDO | null {
    return this.rooms.get(id) || null;
  }

  static listDebates(): DebateSessionRecord[] {
    return Array.from(this.debates.values());
  }
}
