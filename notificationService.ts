export interface DigestNotification {
  userId: number;
  email: string;
  events: Array<{
    id: number;
    title: string;
    type: string;
    startAt: Date;
    location?: string | null;
  }>;
  digestDate: Date;
}

export interface NotificationResult {
  success: boolean;
  userId: number;
  channel: 'email' | 'push';
  error?: string;
}

export interface INotificationService {
  sendDailyDigest(notification: DigestNotification): Promise<NotificationResult>;
}

/**
 * Console-based notification service for development and testing.
 * 
 * PRODUCTION REPLACEMENT:
 * Replace this class with a real email/push provider:
 * - Email: SendGrid, Mailgun, AWS SES, Postmark
 * - Push: Firebase Cloud Messaging, OneSignal, Pusher
 * 
 * Example email implementation:
 * ```typescript
 * import sgMail from '@sendgrid/mail';
 * 
 * export class EmailNotificationService implements INotificationService {
 *   constructor(apiKey: string) {
 *     sgMail.setApiKey(apiKey);
 *   }
 *   
 *   async sendDailyDigest(notification: DigestNotification): Promise<NotificationResult> {
 *     const html = this.generateDigestHtml(notification);
 *     await sgMail.send({
 *       to: notification.email,
 *       from: 'noreply@almanaqueluso.pt',
 *       subject: `Seus eventos de ${notification.digestDate.toLocaleDateString('pt-PT')}`,
 *       html
 *     });
 *     return { success: true, userId: notification.userId, channel: 'email' };
 *   }
 * }
 * ```
 */
export class ConsoleNotificationService implements INotificationService {
  async sendDailyDigest(notification: DigestNotification): Promise<NotificationResult> {
    try {
      console.log(`\n=== Daily Digest for ${notification.email} (User ${notification.userId}) ===`);
      console.log(`Date: ${notification.digestDate.toLocaleDateString('pt-PT')}`);
      console.log(`Events (${notification.events.length}):\n`);
      
      notification.events.forEach((event) => {
        const eventTime = event.startAt.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
        console.log(`  ${eventTime} - ${event.title} (${event.type})`);
        if (event.location) {
          console.log(`    📍 ${event.location}`);
        }
      });
      
      console.log(`\n[DEV MODE] Simulated email send to: ${notification.email}`);
      console.log(`[PRODUCTION] Replace ConsoleNotificationService with email provider`);
      console.log(`===================================\n`);

      // Simulate successful email delivery
      return {
        success: true,
        userId: notification.userId,
        channel: 'email',
      };
    } catch (error: any) {
      console.error(`Failed to send digest for user ${notification.userId}:`, error);
      return {
        success: false,
        userId: notification.userId,
        channel: 'email',
        error: error.message,
      };
    }
  }
}

// TODO: Production implementation with real email service
// export class EmailNotificationService implements INotificationService {
//   async sendDailyDigest(notification: DigestNotification): Promise<NotificationResult> {
//     // Implement with SendGrid, Mailgun, etc.
//     const emailHtml = generateDigestEmailHtml(notification);
//     await emailClient.send({
//       to: notification.email,
//       subject: `AlmanaqueLuso - Seus eventos de ${notification.digestDate.toLocaleDateString('pt-PT')}`,
//       html: emailHtml
//     });
//     return { success: true, userId: notification.userId, channel: 'email' };
//   }
// }
