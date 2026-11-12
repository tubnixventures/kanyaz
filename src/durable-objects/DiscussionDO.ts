import { hashSha256 } from '../utils/crypto.ts';

export interface CommentNode {
  id: string;
  parentId: string | null;
  authorId: string;
  authorName: string;
  content: string;
  isEncrypted: boolean;
  commendCount: number;
  blockHash: string;
  createdAt: number;
}

export class DiscussionDO {
  public targetId: string;
  public comments = new Map<string, CommentNode>();

  constructor(targetId: string) {
    this.targetId = targetId;
  }

  addComment(params: {
    authorId: string;
    authorName: string;
    content: string;
    parentId?: string | null;
    isEncrypted?: boolean;
  }): CommentNode {
    const id = `cm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const createdAt = Date.now();
    const blockHash = hashSha256(`${id}:${params.authorId}:${params.content}:${createdAt}`);
    const node: CommentNode = {
      id,
      parentId: params.parentId || null,
      authorId: params.authorId,
      authorName: params.authorName,
      content: params.content,
      isEncrypted: !!params.isEncrypted,
      commendCount: 0,
      blockHash,
      createdAt,
    };
    this.comments.set(id, node);
    return node;
  }

  commendComment(commentId: string): number {
    const comment = this.comments.get(commentId);
    if (!comment) throw new Error('Comment not found');
    comment.commendCount += 1;
    return comment.commendCount;
  }

  getThreadTree(parentId: string | null = null): CommentNode[] {
    return Array.from(this.comments.values()).filter((c) => c.parentId === parentId);
  }
}
