import crypto from 'node:crypto';

export function hashSha256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function generateVoteReceipt(params: {
  electionId: string;
  optionId: string;
  voterSecret: string;
  timestamp: number;
}): { receiptHash: string; auditToken: string } {
  const secretPayload = `${params.electionId}:${params.optionId}:${params.voterSecret}:${params.timestamp}`;
  const receiptHash = crypto.createHmac('sha256', params.electionId).update(secretPayload).digest('hex');
  const auditToken = crypto.randomBytes(16).toString('hex');
  return { receiptHash, auditToken };
}

export function generateDeviceFingerprint(ip: string, userAgent: string, clientNonce: string): string {
  return hashSha256(`${ip}::${userAgent}::${clientNonce}`);
}

export function generateMerkleRoot(hashes: string[]): string {
  if (hashes.length === 0) return hashSha256('empty_block');
  let currentLevel = [...hashes];
  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = currentLevel[i + 1] || left;
      nextLevel.push(hashSha256(left + right));
    }
    currentLevel = nextLevel;
  }
  return currentLevel[0];
}
