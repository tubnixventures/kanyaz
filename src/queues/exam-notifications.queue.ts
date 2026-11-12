import { EmailDispatchQueue } from './email-dispatch.queue.ts';

export interface ExamNotificationPayload {
  examId: string;
  examTitle: string;
  studentId: string;
  studentEmail: string;
  studentName: string;
  totalScore: number;
  totalMaxPoints: number;
  percentage: number;
  status: 'completed' | 'cancelled_malpractice' | 'in_progress';
}

export class ExamNotificationsQueue {
  private static queue: ExamNotificationPayload[] = [];
  private static deliveredLogs = new Map<string, { deliveredAt: number; status: string }>();

  static async enqueueBatch(notifications: ExamNotificationPayload[]): Promise<number> {
    this.queue.push(...notifications);
    // Asynchronously dispatch without blocking examiner response
    setTimeout(() => this.processNext().catch((err) => console.error('[ExamQueue Error]', err)), 0);
    return notifications.length;
  }

  private static async processNext(): Promise<{ processed: number }> {
    let processed = 0;
    while (this.queue.length > 0) {
      const item = this.queue.shift();
      if (!item) break;

      const subject = `Official Results: ${item.examTitle}`;
      const textSummary = item.status === 'cancelled_malpractice'
        ? `Your examination was cancelled due to reported malpractice. Final Awarded Mark: 0/${item.totalMaxPoints}.`
        : `Congratulations! Your examination has been marked. Final Score: ${item.totalScore}/${item.totalMaxPoints} (${item.percentage}%). Status: ${item.status}.`;

      EmailDispatchQueue.enqueue({
        toEmail: item.studentEmail,
        toName: item.studentName,
        subject,
        htmlContent: `<p>${textSummary}</p><p>Ref: Exam ${item.examId} | Student: ${item.studentId}</p>`,
      });

      this.deliveredLogs.set(`${item.examId}::${item.studentId}`, { deliveredAt: Date.now(), status: 'DISPATCHED' });
      processed += 1;
    }
    return { processed };
  }

  static getPendingCount(): number {
    return this.queue.length;
  }

  static getExamDeliveryStatus(examId: string, studentId: string) {
    return this.deliveredLogs.get(`${examId}::${studentId}`) || null;
  }
}
