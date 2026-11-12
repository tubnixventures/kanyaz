export interface CandidateStreamSession {
  studentId: string;
  examId: string;
  whipIngestUrl: string;
  whepPlaybackUrl: string;
  hlsPlaybackUrl: string;
  kioskEnforced: boolean;
  status: 'streaming' | 'offline' | 'flagged' | 'cancelled_malpractice';
  activeFlags: string[];
}

export class ProctorStreamService {
  private static streams = new Map<string, CandidateStreamSession>();

  static registerCandidateStream(examId: string, studentId: string): CandidateStreamSession {
    const key = `${examId}::${studentId}`;
    const accountId = process.env.CF_ACCOUNT_ID || 'cf_account_lively';
    const streamId = `proctor_${examId}_${studentId}`;

    const session: CandidateStreamSession = {
      studentId,
      examId,
      whipIngestUrl: `https://customer-${accountId}.cloudflarestream.com/${streamId}/webRTC/publish`,
      whepPlaybackUrl: `https://customer-${accountId}.cloudflarestream.com/${streamId}/webRTC/play`,
      hlsPlaybackUrl: `https://customer-${accountId}.cloudflarestream.com/${streamId}/manifest/video.m3u8`,
      kioskEnforced: true,
      status: 'streaming',
      activeFlags: [],
    };

    this.streams.set(key, session);
    return session;
  }

  static getProctorMatrix(examId: string): CandidateStreamSession[] {
    const results: CandidateStreamSession[] = [];
    for (const [key, stream] of this.streams.entries()) {
      if (key.startsWith(`${examId}::`)) {
        results.push(stream);
      }
    }
    return results;
  }

  static updateTelemetry(examId: string, studentId: string, flags: string[]): CandidateStreamSession | null {
    const key = `${examId}::${studentId}`;
    const session = this.streams.get(key) || this.registerCandidateStream(examId, studentId);
    session.activeFlags = flags;
    if (flags.length > 0) session.status = 'flagged';
    return session;
  }

  static markMalpractice(examId: string, studentId: string): void {
    const key = `${examId}::${studentId}`;
    const session = this.streams.get(key);
    if (session) {
      session.status = 'cancelled_malpractice';
      session.activeFlags.push('EXAM_MALPRACTICE_CANCELLED');
    }
  }
}
