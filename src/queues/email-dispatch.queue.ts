import { ZeptoMailService, EmailPayload } from '../services/zeptomail.service.ts';

export class EmailDispatchQueue {
  private static queue: EmailPayload[] = [];
  private static isProcessing = false;

  static enqueue(payload: EmailPayload): void {
    this.queue.push(payload);
    this.processNext().catch((err) => console.error('[Queue Error]', err));
  }

  private static async processNext(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;
    try {
      while (this.queue.length > 0) {
        const item = this.queue.shift();
        if (item) {
          await ZeptoMailService.sendMail(item);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  static getPendingCount(): number {
    return this.queue.length;
  }
}
