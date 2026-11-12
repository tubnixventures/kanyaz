import { ModerateExamResultsInput } from '../schema/moderation.schema.ts';
import { ExamScriptService, CandidateScript } from './exam-script.service.ts';
import { hashSha256 } from '../utils/crypto.ts';

export interface ModeratedExamResult {
  examId: string;
  verdict: 'approved' | 'rejected' | 'curve_applied';
  moderatorId: string;
  moderatorNotes: string;
  curveAdjustmentPercentage: number;
  moderationHash: string;
  moderatedAt: number;
  moderatedScripts: CandidateScript[];
}

export class ModerationService {
  private static moderations = new Map<string, ModeratedExamResult>();

  static moderateResults(examId: string, input: ModerateExamResultsInput): ModeratedExamResult {
    const rawScripts = ExamScriptService.downloadAllScripts(examId);

    const moderatedScripts: CandidateScript[] = rawScripts.map((script) => {
      if (script.status === 'cancelled_malpractice') return script;
      let adjustedScore = script.totalScore;
      if (input.curveAdjustmentPercentage !== 0) {
        const bonus = Math.round((script.totalScore * input.curveAdjustmentPercentage) / 100);
        adjustedScore = Math.min(script.totalMaxPoints, Math.max(0, script.totalScore + bonus));
      }
      return { ...script, totalScore: adjustedScore };
    });

    const timestamp = Date.now();
    const moderationHash = hashSha256(`${examId}::${input.moderatorId}::${input.verdict}::${timestamp}`);
    const record: ModeratedExamResult = {
      examId,
      verdict: input.verdict,
      moderatorId: input.moderatorId,
      moderatorNotes: input.moderatorNotes,
      curveAdjustmentPercentage: input.curveAdjustmentPercentage,
      moderationHash,
      moderatedAt: timestamp,
      moderatedScripts,
    };

    this.moderations.set(examId, record);
    return record;
  }

  static getModerationRecord(examId: string): ModeratedExamResult | null {
    return this.moderations.get(examId) || null;
  }

  static isExamModerated(examId: string): boolean {
    const record = this.moderations.get(examId);
    return !!record && record.verdict !== 'rejected';
  }
}
