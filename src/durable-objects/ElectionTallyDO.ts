import { generateVoteReceipt } from '../utils/crypto.ts';

export interface TallySummary {
  electionId: string;
  totalVotes: number;
  optionsTally: Record<string, number>;
  regionalBreakdown: Record<string, number>;
  receiptsRegistry: Set<string>;
}

export class ElectionTallyDO {
  public electionId: string;
  public totalVotes = 0;
  public optionsTally: Record<string, number> = {};
  public regionalBreakdown: Record<string, number> = {};
  private receiptsRegistry = new Set<string>();

  constructor(electionId: string, initialOptionIds: string[]) {
    this.electionId = electionId;
    initialOptionIds.forEach((id) => (this.optionsTally[id] = 0));
  }

  recordVote(optionId: string, voterSecret: string, regionTag = 'National') {
    const timestamp = Date.now();
    const { receiptHash, auditToken } = generateVoteReceipt({
      electionId: this.electionId,
      optionId,
      voterSecret,
      timestamp,
    });

    this.optionsTally[optionId] = (this.optionsTally[optionId] || 0) + 1;
    this.totalVotes += 1;
    this.regionalBreakdown[regionTag] = (this.regionalBreakdown[regionTag] || 0) + 1;
    this.receiptsRegistry.add(receiptHash);

    return { receiptHash, auditToken, timestamp };
  }

  verifyReceipt(receiptHash: string): boolean {
    return this.receiptsRegistry.has(receiptHash);
  }

  getSnapshot(): TallySummary {
    return {
      electionId: this.electionId,
      totalVotes: this.totalVotes,
      optionsTally: { ...this.optionsTally },
      regionalBreakdown: { ...this.regionalBreakdown },
      receiptsRegistry: this.receiptsRegistry,
    };
  }
}
