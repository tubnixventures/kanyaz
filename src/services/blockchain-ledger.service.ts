import { hashSha256, generateMerkleRoot } from '../utils/crypto.ts';

export interface LedgerBlock {
  blockNumber: number;
  timestamp: number;
  previousHash: string;
  merkleRoot: string;
  blockHash: string;
  recordsCount: number;
}

export class BlockchainLedgerService {
  private static chain: LedgerBlock[] = [
    {
      blockNumber: 0,
      timestamp: 1700000000000,
      previousHash: '0000000000000000000000000000000000000000000000000000000000000000',
      merkleRoot: hashSha256('genesis_lively_blockchain'),
      blockHash: hashSha256('genesis_lively_blockchain_block_0'),
      recordsCount: 0,
    },
  ];

  static commitRecordBatch(recordHashes: string[]): LedgerBlock {
    const prevBlock = this.chain[this.chain.length - 1];
    const merkleRoot = generateMerkleRoot(recordHashes);
    const timestamp = Date.now();
    const blockNumber = prevBlock.blockNumber + 1;
    const blockHash = hashSha256(`${blockNumber}:${prevBlock.blockHash}:${merkleRoot}:${timestamp}`);

    const newBlock: LedgerBlock = {
      blockNumber,
      timestamp,
      previousHash: prevBlock.blockHash,
      merkleRoot,
      blockHash,
      recordsCount: recordHashes.length,
    };

    this.chain.push(newBlock);
    return newBlock;
  }

  static verifyChainIntegrity(): boolean {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];
      if (current.previousHash !== previous.blockHash) return false;
      const expectedHash = hashSha256(
        `${current.blockNumber}:${previous.blockHash}:${current.merkleRoot}:${current.timestamp}`
      );
      if (current.blockHash !== expectedHash) return false;
    }
    return true;
  }

  static getChainSummary() {
    return {
      blocksCount: this.chain.length,
      latestBlock: this.chain[this.chain.length - 1],
      isTamperFree: this.verifyChainIntegrity(),
    };
  }
}
