import { DiscussionDO, CommentNode } from '../durable-objects/DiscussionDO.ts';
import { EncryptionService } from './encryption.service.ts';
import { BlockchainLedgerService } from './blockchain-ledger.service.ts';

export class DiscussionService {
  private static discussions = new Map<string, DiscussionDO>();

  static getOrCreateDO(targetId: string): DiscussionDO {
    let instance = this.discussions.get(targetId);
    if (!instance) {
      instance = new DiscussionDO(targetId);
      this.discussions.set(targetId, instance);
    }
    return instance;
  }

  static postComment(params: {
    targetId: string;
    authorId: string;
    authorName: string;
    content: string;
    parentId?: string | null;
    isEncrypted?: boolean;
  }): CommentNode {
    const discussionDO = this.getOrCreateDO(params.targetId);
    let finalContent = params.content;
    if (params.isEncrypted) {
      finalContent = EncryptionService.encrypt(params.content);
    }

    const comment = discussionDO.addComment({
      ...params,
      content: finalContent,
    });

    BlockchainLedgerService.commitRecordBatch([comment.blockHash]);
    return comment;
  }

  static getDiscussionTree(targetId: string, parentId: string | null = null): CommentNode[] {
    const discussionDO = this.getOrCreateDO(targetId);
    return discussionDO.getThreadTree(parentId);
  }

  static commend(targetId: string, commentId: string): number {
    const discussionDO = this.getOrCreateDO(targetId);
    return discussionDO.commendComment(commentId);
  }
}
