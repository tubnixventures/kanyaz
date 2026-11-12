import { BlockchainLedgerService } from '../services/blockchain-ledger.service.ts';

export interface VoteAuditMessage {
  electionId: string;
  receiptHash: string;
  timestamp: number;
}

export class VoteAuditQueue {
  private static buffer: VoteAuditMessage[] = [];
  private static readonly BATCH_THRESHOLD = 50;

  static async enqueue(message: VoteAuditMessage): Promise<void> {
    this.buffer.push(message);
    if (this.buffer.length >= this.BATCH_THRESHOLD) {
      await this.flush();
    }
  }

  static async flush(): Promise<{ committed: number; blockHash?: string }> {
    if (this.buffer.length === 0) return { committed: 0 };
    const batch = [...this.buffer];
    this.buffer = [];

    const recordHashes = batch.map((m) => m.receiptHash);
    const block = BlockchainLedgerService.commitRecordBatch(recordHashes);
    return { committed: batch.length, blockHash: block.blockHash };
  }

  static getQueueSize(): number {
    return this.buffer.length;
  }
}
