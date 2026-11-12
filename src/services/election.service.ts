import { CreateElectionInput } from '../schema/election.schema.ts';
import { ElectionTallyDO } from '../durable-objects/ElectionTallyDO.ts';

export interface ElectionRecord extends CreateElectionInput {
  id: string;
  createdAt: number;
  creatorId: string;
}

export class ElectionService {
  private static elections = new Map<string, ElectionRecord>();
  private static tallies = new Map<string, ElectionTallyDO>();

  static createElection(input: CreateElectionInput, creatorId: string): ElectionRecord {
    const id = `el_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const record: ElectionRecord = { ...input, id, createdAt: Date.now(), creatorId };
    this.elections.set(id, record);

    const optionIds = input.options.map((o) => o.id);
    const tallyDO = new ElectionTallyDO(id, optionIds);
    this.tallies.set(id, tallyDO);

    return record;
  }

  static getElection(id: string): ElectionRecord | null {
    return this.elections.get(id) || null;
  }

  static listElections(filter?: { scope?: string; country?: string }): ElectionRecord[] {
    const all = Array.from(this.elections.values());
    if (!filter) return all;
    return all.filter((e) => {
      if (filter.scope && e.scope !== filter.scope) return false;
      if (filter.country && e.geoTracking.country.toLowerCase() !== filter.country.toLowerCase()) return false;
      return true;
    });
  }

  static getTallyDO(id: string): ElectionTallyDO | null {
    return this.tallies.get(id) || null;
  }
}
