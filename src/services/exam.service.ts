import { CreateExamInput } from '../schema/exam.schema.ts';
import { ExamSessionDO } from '../durable-objects/ExamSessionDO.ts';

export interface ExamRecord extends CreateExamInput {
  id: string;
  createdAt: number;
}

export class ExamService {
  private static exams = new Map<string, ExamRecord>();
  private static sessions = new Map<string, ExamSessionDO>();

  static createExam(input: CreateExamInput): ExamRecord {
    const id = `exam_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const record: ExamRecord = { ...input, id, createdAt: Date.now() };
    this.exams.set(id, record);

    const sessionDO = new ExamSessionDO(id, input.invigilatorId, input.questions);
    this.sessions.set(id, sessionDO);

    return record;
  }

  static getExam(id: string): ExamRecord | null {
    return this.exams.get(id) || null;
  }

  static getSessionDO(id: string): ExamSessionDO | null {
    return this.sessions.get(id) || null;
  }

  static listExams(): ExamRecord[] {
    return Array.from(this.exams.values());
  }

  static calculateScore(examId: string, studentId: string): { score: number; totalPoints: number } {
    const exam = this.getExam(examId);
    const session = this.getSessionDO(examId);
    if (!exam || !session) return { score: 0, totalPoints: 0 };

    let score = 0;
    let totalPoints = 0;

    exam.questions.forEach((q) => {
      totalPoints += q.maxPoints;
      const answer = session.answers.get(`${studentId}:${q.id}`);
      if (answer && answer.optionIndex === q.correctOptionIndex) {
        score += q.maxPoints;
      }
    });

    return { score, totalPoints };
  }
}
