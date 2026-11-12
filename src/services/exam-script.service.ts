import { ExamService } from './exam.service.ts';
import { NotFoundError } from '../utils/errors.ts';

export interface ExamScriptItem {
  questionId: string;
  prompt: string;
  selectedOptionIndex: number | null;
  selectedText?: string;
  isCorrect: boolean;
  score: number;
  maxPoints: number;
  answerHash?: string;
  manualNotes?: string;
}

export interface CandidateScript {
  examId: string;
  examTitle: string;
  studentId: string;
  status: 'completed' | 'cancelled_malpractice' | 'in_progress';
  malpracticeReason?: string;
  totalScore: number;
  totalMaxPoints: number;
  scripts: ExamScriptItem[];
  securityIncidents: { type: string; timestamp: number }[];
  downloadTimestamp: string;
}

export class ExamScriptService {
  private static manualMarks = new Map<string, { points: number; notes?: string }>();
  private static cancelledCandidates = new Map<string, { reason: string; timestamp: number }>();

  static recordManualMark(examId: string, studentId: string, questionId: string, points: number, notes?: string) {
    this.manualMarks.set(`${examId}::${studentId}::${questionId}`, { points, notes });
  }

  static cancelCandidate(examId: string, studentId: string, reason: string) {
    this.cancelledCandidates.set(`${examId}::${studentId}`, { reason, timestamp: Date.now() });
    const session = ExamService.getSessionDO(examId);
    if (session) session.handleInvigilatorControl(session.invigilatorId, 'terminate_student', undefined, studentId);
  }

  static generateScript(examId: string, studentId: string): CandidateScript {
    const exam = ExamService.getExam(examId);
    const session = ExamService.getSessionDO(examId);
    if (!exam || !session) throw new NotFoundError('Exam or active session not found');

    const cancellation = this.cancelledCandidates.get(`${examId}::${studentId}`);
    const incidents = session.securityIncidents.get(studentId) || [];
    let totalScore = 0;
    let totalMaxPoints = 0;

    const items: ExamScriptItem[] = exam.questions.map((q) => {
      totalMaxPoints += q.maxPoints;
      const ans = session.answers.get(`${studentId}:${q.id}`);
      const manual = this.manualMarks.get(`${examId}::${studentId}::${q.id}`);
      const isCorrect = ans ? ans.optionIndex === q.correctOptionIndex : false;
      const earned = manual ? manual.points : (isCorrect ? q.maxPoints : 0);
      totalScore += earned;

      return {
        questionId: q.id,
        prompt: q.prompt,
        selectedOptionIndex: ans ? ans.optionIndex : null,
        selectedText: ans ? q.options[ans.optionIndex] : undefined,
        isCorrect,
        score: earned,
        maxPoints: q.maxPoints,
        answerHash: ans?.hash,
        manualNotes: manual?.notes,
      };
    });

    return {
      examId,
      examTitle: exam.title,
      studentId,
      status: cancellation ? 'cancelled_malpractice' : 'completed',
      malpracticeReason: cancellation?.reason,
      totalScore: cancellation ? 0 : totalScore,
      totalMaxPoints,
      scripts: items,
      securityIncidents: incidents,
      downloadTimestamp: new Date().toISOString(),
    };
  }

  static downloadAllScripts(examId: string): CandidateScript[] {
    const session = ExamService.getSessionDO(examId);
    if (!session) throw new NotFoundError('Exam session not found');
    return Array.from(session.students.keys()).map((sid) => this.generateScript(examId, sid));
  }
}
