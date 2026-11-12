export interface FactCheckClaim {
  id: string;
  debateId: string;
  speakerUserId: string;
  claimStatement: string;
  verdict: 'true' | 'mostly_true' | 'misleading' | 'false' | 'unverified';
  citationSources: string[];
  reviewedAt: number;
}

export class FactCheckService {
  private static claims = new Map<string, FactCheckClaim[]>();
  private static votingHistory = new Map<string, { electionTitle: string; timestamp: number }[]>();

  static submitFactCheck(claim: Omit<FactCheckClaim, 'id' | 'reviewedAt'>): FactCheckClaim {
    const record: FactCheckClaim = {
      ...claim,
      id: `fc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      reviewedAt: Date.now(),
    };
    const list = this.claims.get(claim.debateId) || [];
    list.push(record);
    this.claims.set(claim.debateId, list);
    return record;
  }

  static getDebateClaims(debateId: string): FactCheckClaim[] {
    return this.claims.get(debateId) || [];
  }

  static recordVoterParticipation(userId: string, electionTitle: string) {
    const history = this.votingHistory.get(userId) || [];
    history.push({ electionTitle, timestamp: Date.now() });
    this.votingHistory.set(userId, history);
  }

  static getVoterCivicHistory(userId: string) {
    return this.votingHistory.get(userId) || [];
  }
}
