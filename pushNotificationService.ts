import webpush from 'web-push';
import { db } from '../db';
import { pushSubscriptions, notificationPreferences } from '@shared/schema';
import { eq } from 'drizzle-orm';
import ENV from '../env';

// VAPID keys from ENV loader (works around Replit Secrets underscore bug)
// ENV tries aliases without underscores first (VAPIDPUBLICKEY), then falls back to VAPID_PUBLIC_KEY
// Fallback to hardcoded keys if ENV is still empty (for reliability during transition period)
const VAPID_PUBLIC_KEY = ENV.VAPID_PUBLIC_KEY || 'BD58hkgWvX5JcQAkLosAmWc1YMCsYcKKG0Z5e1H98PQ2YeE3kxVVljuBkgUNu4s6ocGbBaAQ4ldR6MwuoFlV7C8';
const VAPID_PRIVATE_KEY = ENV.VAPID_PRIVATE_KEY || 'pTXiOx3tPdavzlwR3FLrJd2yg9FgzwPyWr7Ctl3w9YA';
const VAPID_SUBJECT = 'mailto:notifications@almanaqueluso.pt';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(
      VAPID_SUBJECT,
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    );
    console.log('✅ Push notifications configured with VAPID keys');
  } catch (error: any) {
    console.error('❌ Failed to configure VAPID keys:', error.message);
    console.warn('⚠️  Push notifications will not work. Please check your VAPID keys.');
  }
} else {
  console.warn('⚠️  VAPID keys not configured. Push notifications will not work.');
  console.warn('Generate keys with: npx web-push generate-vapid keys');
}

export interface NotificationPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: Array<{ action: string; title: string; icon?: string }>;
}

export class PushNotificationService {
  /**
   * Send push notification to a specific user
   */
  static async sendToUser(userId: number, payload: NotificationPayload): Promise<void> {
    try {
      // Get all subscriptions for this user
      const subscriptions = await db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.userId, userId));

      if (subscriptions.length === 0) {
        console.log(`No push subscriptions found for user ${userId}`);
        return;
      }

      // Send to all user's devices
      const promises = subscriptions.map(async (sub) => {
        try {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: sub.keys as { p256dh: string; auth: string },
          };

          await webpush.sendNotification(
            pushSubscription,
            JSON.stringify(payload)
          );
          
          console.log(`✓ Push sent to user ${userId} (${sub.endpoint.substring(0, 50)}...)`);
        } catch (error: any) {
          // Handle subscription errors
          if (error.statusCode === 410 || error.statusCode === 404) {
            // Subscription expired or invalid - remove it
            await db
              .delete(pushSubscriptions)
              .where(eq(pushSubscriptions.id, sub.id));
            console.log(`Removed expired subscription for user ${userId}`);
          } else {
            console.error(`Failed to send push to user ${userId}:`, error.message);
          }
        }
      });

      await Promise.allSettled(promises);
    } catch (error) {
      console.error('Error sending push notification:', error);
      throw error;
    }
  }

  /**
   * Send notification based on user's preferences
   */
  static async sendWithPreferences(
    userId: number,
    notificationType: 'tides' | 'sports' | 'astronomy' | 'agriculture' | 'cultural' | 'holidays',
    payload: NotificationPayload
  ): Promise<void> {
    try {
      // Check user's notification preferences
      const prefs = await db
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, userId))
        .limit(1);

      if (prefs.length === 0) {
        // No preferences set, use defaults (send all)
        await this.sendToUser(userId, payload);
        return;
      }

      const pref = prefs[0];
      
      // Check if this notification type is enabled
      const enabledField = `${notificationType}Enabled` as keyof typeof pref;
      if (!pref[enabledField]) {
        console.log(`User ${userId} has ${notificationType} notifications disabled`);
        return;
      }

      // Check frequency (this will be used by scheduler jobs)
      const frequencyField = `${notificationType}Frequency` as keyof typeof pref;
      const frequency = pref[frequencyField];
      
      // For "immediate" frequency, send right away
      if (frequency === 'immediate') {
        await this.sendToUser(userId, payload);
      } else {
        console.log(`User ${userId} has ${notificationType} set to ${frequency} - will be batched`);
      }
    } catch (error) {
      console.error('Error checking notification preferences:', error);
      throw error;
    }
  }

  /**
   * Check if current time is within user's quiet hours
   */
  static isQuietHours(prefs: any): boolean {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const quietStart = prefs.quietHoursStart || '22:00';
    const quietEnd = prefs.quietHoursEnd || '08:00';

    // If quiet hours cross midnight
    if (quietStart > quietEnd) {
      return currentTime >= quietStart || currentTime < quietEnd;
    } else {
      return currentTime >= quietStart && currentTime < quietEnd;
    }
  }

  /**
   * Send notification to multiple users
   */
  static async sendToUsers(userIds: number[], payload: NotificationPayload): Promise<void> {
    const promises = userIds.map(userId => this.sendToUser(userId, payload));
    await Promise.allSettled(promises);
  }

  /**
   * Get VAPID public key for frontend
   */
  static getPublicKey(): string {
    return VAPID_PUBLIC_KEY;
  }
}
