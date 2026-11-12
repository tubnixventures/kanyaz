import { ExamQuestion } from '../schema/exam.schema.ts';
import { ForbiddenError } from '../utils/errors.ts';
import { hashSha256 } from '../utils/crypto.ts';

export class ExamSessionDO {
  public examId: string;
  public invigilatorId: string;
  public questions: ExamQuestion[];
  public activeQuestionIndex = 0;
  public isLocked = false;
  public isPaused = false;
  public students = new Map<string, { studentId: string; joinedAt: number; status: 'active' | 'terminated' }>();
  public answers = new Map<string, { optionIndex: number; submittedAt: number; hash: string }>();
  public securityIncidents = new Map<string, { type: string; timestamp: number }[]>();

  constructor(examId: string, invigilatorId: string, questions: ExamQuestion[]) {
    this.examId = examId;
    this.invigilatorId = invigilatorId;
    this.questions = questions;
  }

  handleInvigilatorControl(callerId: string, action: string, targetIndex?: number, targetStudentId?: string) {
    if (callerId !== this.invigilatorId) throw new ForbiddenError('Only the authorized Invigilator controls the exam flow');

    if (action === 'next' && this.activeQuestionIndex < this.questions.length - 1) {
      this.activeQuestionIndex += 1;
      this.isLocked = false;
    } else if (action === 'back' && this.activeQuestionIndex > 0) {
      this.activeQuestionIndex -= 1;
    } else if (action === 'lock') {
      this.isLocked = true;
    } else if (action === 'pause') {
      this.isPaused = true;
    } else if (action === 'resume') {
      this.isPaused = false;
    } else if (action === 'jump' && typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex < this.questions.length) {
      this.activeQuestionIndex = targetIndex;
    } else if (action === 'terminate_student' && targetStudentId) {
      const student = this.students.get(targetStudentId);
      if (student) student.status = 'terminated';
    }
    return this.getStateSnapshot();
  }

  joinStudent(studentId: string) {
    this.students.set(studentId, { studentId, joinedAt: Date.now(), status: 'active' });
    return { examId: this.examId, activeIndex: this.activeQuestionIndex, totalQuestions: this.questions.length };
  }

  getActiveQuestionForStudent(studentId: string) {
    const student = this.students.get(studentId);
    if (!student || student.status === 'terminated') throw new ForbiddenError('Access revoked: student is terminated or not registered');
    if (this.isPaused) throw new ForbiddenError('Exam is currently paused by the Invigilator');

    const currentQ = this.questions[this.activeQuestionIndex];
    return {
      index: this.activeQuestionIndex,
      total: this.questions.length,
      isLocked: this.isLocked,
      questionId: currentQ.id,
      prompt: currentQ.prompt,
      options: currentQ.options,
      timeLimitSeconds: currentQ.timeLimitSeconds,
    };
  }

  submitAnswer(studentId: string, questionId: string, optionIndex: number) {
    const student = this.students.get(studentId);
    if (!student || student.status === 'terminated') throw new ForbiddenError('Submission rejected: student is disqualified or inactive');
    if (this.isLocked || this.isPaused) throw new ForbiddenError('Submissions are locked for this question');

    const currentQ = this.questions[this.activeQuestionIndex];
    if (currentQ.id !== questionId) throw new ForbiddenError('Question window expired: only active question can be answered');

    const answerHash = hashSha256(`${this.examId}:${studentId}:${questionId}:${optionIndex}:${Date.now()}`);
    this.answers.set(`${studentId}:${questionId}`, { optionIndex, submittedAt: Date.now(), hash: answerHash });
    return { recorded: true, answerHash };
  }

  recordIncident(studentId: string, incidentType: string) {
    const list = this.securityIncidents.get(studentId) || [];
    list.push({ type: incidentType, timestamp: Date.now() });
    this.securityIncidents.set(studentId, list);
    return { incidentCount: list.length, flagged: list.length >= 3 };
  }

  getStateSnapshot() {
    return {
      examId: this.examId,
      activeQuestionIndex: this.activeQuestionIndex,
      isLocked: this.isLocked,
      isPaused: this.isPaused,
      totalQuestions: this.questions.length,
      candidateCount: this.students.size,
    };
  }
}
