export interface EmailPayload {
  toEmail: string;
  toName: string;
  subject: string;
  htmlContent: string;
}

export class ZeptoMailService {
  private static readonly API_URL = 'https://api.zeptomail.com/v1.1/email';
  private static readonly SENDER_EMAIL = process.env.ZEPTOMAIL_SENDER || 'noreply@lively.org';
  private static readonly SENDER_NAME = 'Lively Voting Platform';

  static async sendMail(payload: EmailPayload): Promise<{ success: boolean; messageId?: string }> {
    const token = process.env.ZEPTOMAIL_API_TOKEN;
    if (!token) {
      // In development or simulation mode without token, log mock dispatch
      console.log(`[ZeptoMail Mock] Email sent to ${payload.toEmail}: ${payload.subject}`);
      return { success: true, messageId: `mock_zepto_${Date.now()}` };
    }

    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Zoho-enczapikey ${token}`,
        },
        body: JSON.stringify({
          from: { address: this.SENDER_EMAIL, name: this.SENDER_NAME },
          to: [{ email_address: { address: payload.toEmail, name: payload.toName } }],
          subject: payload.subject,
          htmlbody: payload.htmlContent,
        }),
      });

      const result = (await response.json()) as { data?: [{ message_id?: string }] };
      return { success: response.ok, messageId: result.data?.[0]?.message_id };
    } catch (err) {
      console.error('[ZeptoMail Error]', err);
      return { success: false };
    }
  }

  static async sendBallotReceipt(toEmail: string, electionTitle: string, receiptHash: string) {
    return this.sendMail({
      toEmail,
      toName: 'Voter',
      subject: `Ballot Receipt: ${electionTitle}`,
      htmlContent: `<h2>Your Vote Has Been Recorded</h2><p>Election: ${electionTitle}</p><p>Cryptographic Receipt Hash: <code>${receiptHash}</code></p>`,
    });
  }
}
