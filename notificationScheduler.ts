import cron from 'node-cron';
import { db } from '../db';
import { notificationPreferences, pushSubscriptions, events } from '@shared/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { PushNotificationService } from '../services/pushNotificationService';

interface NotificationContext {
  userId: number;
  preferences: any;
  subscriptions: any[];
}

/**
 * Check if current time is within user's quiet hours
 */
function isQuietHours(quietStart: string, quietEnd: string): boolean {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;

  const [startHour, startMin] = quietStart.split(':').map(Number);
  const [endHour, endMin] = quietEnd.split(':').map(Number);
  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;

  // Handle overnight quiet hours (e.g., 22:00 - 08:00)
  if (startTime > endTime) {
    return currentTime >= startTime || currentTime <= endTime;
  }
  
  return currentTime >= startTime && currentTime <= endTime;
}

/**
 * Get users who should receive notifications based on their preferences
 */
async function getUsersForNotifications() {
  const contexts: NotificationContext[] = [];

  // Get all users with notification preferences
  const prefs = await db
    .select()
    .from(notificationPreferences);

  for (const pref of prefs) {
    // Skip if in quiet hours
    if (isQuietHours(pref.quietHoursStart || '22:00', pref.quietHoursEnd || '08:00')) {
      continue;
    }

    // Get user's push subscriptions
    const subs = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, pref.userId));

    if (subs.length > 0) {
      contexts.push({
        userId: pref.userId,
        preferences: pref,
        subscriptions: subs,
      });
    }
  }

  return contexts;
}

/**
 * Get events to notify about based on user preferences
 */
async function getRelevantEvents(context: NotificationContext) {
  const { preferences } = context;
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const eventTypes: string[] = [];

  // Map preferences to event types
  if (preferences.tidesEnabled && preferences.tidesFrequency !== 'never') {
    eventTypes.push('tide');
  }
  if (preferences.sportsEnabled && preferences.sportsFrequency !== 'never') {
    eventTypes.push('match_liga', 'uefa', 'fifa');
  }
  if (preferences.astronomyEnabled && preferences.astronomyFrequency !== 'never') {
    eventTypes.push('astronomy', 'moon');
  }
  if (preferences.agricultureEnabled && preferences.agricultureFrequency !== 'never') {
    eventTypes.push('agriculture');
  }
  if (preferences.culturalEnabled && preferences.culturalFrequency !== 'never') {
    eventTypes.push('event_pt', 'cultural');
  }
  if (preferences.holidaysEnabled && preferences.holidaysFrequency !== 'never') {
    eventTypes.push('holiday');
  }

  if (eventTypes.length === 0) return [];

  // Get upcoming events
  const upcomingEvents = await db
    .select()
    .from(events)
    .where(
      and(
        sql`${events.type} = ANY(${eventTypes})`,
        gte(events.startAt, now),
        lte(events.startAt, tomorrow)
      )
    )
    .limit(10);

  return upcomingEvents;
}

/**
 * Send daily digest notifications
 */
async function sendDailyDigest() {
  console.log('=== Running Daily Digest Job ===');
  const startTime = Date.now();

  try {
    const contexts = await getUsersForNotifications();
    let notificationsSent = 0;

    for (const context of contexts) {
      const { preferences, subscriptions } = context;

      // Check if it's the user's preferred notification time
      const now = new Date();
      const [prefHour, prefMin] = (preferences.preferredNotificationTime || '09:00').split(':').map(Number);
      
      // Calculate time in minutes
      const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
      const preferredTotalMinutes = prefHour * 60 + prefMin;
      
      // Only send if we're at or after the preferred time, but within 15 minutes
      // This ensures only ONE notification per day (the first cron run at or after preferred time)
      if (currentTotalMinutes < preferredTotalMinutes || currentTotalMinutes >= preferredTotalMinutes + 15) {
        continue;
      }

      const relevantEvents = await getRelevantEvents(context);
      
      if (relevantEvents.length > 0) {
        const title = `AlmanaqueLuso - ${relevantEvents.length} eventos hoje`;
        const body = relevantEvents
          .slice(0, 3)
          .map(e => e.title)
          .join(', ');

        try {
          await PushNotificationService.sendToUser(context.userId, {
            title,
            body,
            url: '/dashboard',
            tag: 'daily-digest',
          });
          notificationsSent += subscriptions.length;
        } catch (error) {
          console.error(`Failed to send notification to user ${context.userId}:`, error);
        }
      }
    }

    console.log(`✓ Daily digest sent to ${notificationsSent} subscriptions`);
  } catch (error) {
    console.error('Daily digest job failed:', error);
  } finally {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Daily digest job completed in ${duration}s`);
  }
}

/**
 * Send immediate notifications for urgent events (e.g., tides)
 */
async function sendImmediateNotifications() {
  try {
    const contexts = await getUsersForNotifications();

    for (const context of contexts) {
      const { preferences, subscriptions } = context;

      // Only send immediate notifications for tides (if enabled with immediate frequency)
      if (!preferences.tidesEnabled || preferences.tidesFrequency !== 'immediate') {
        continue;
      }

      const now = new Date();
      const oneHour = new Date(now);
      oneHour.setHours(oneHour.getHours() + 1);

      // Get tide events in the next hour
      const upcomingTides = await db
        .select()
        .from(events)
        .where(
          and(
            eq(events.type, 'tide'),
            gte(events.startAt, now),
            lte(events.startAt, oneHour)
          )
        )
        .limit(5);

      if (upcomingTides.length > 0) {
        for (const tide of upcomingTides) {
          try {
            await PushNotificationService.sendToUser(context.userId, {
              title: 'AlmanaqueLuso - Maré Próxima',
              body: `${tide.title} - ${tide.location}`,
              url: '/dashboard',
              tag: `tide-${tide.id}`,
            });
          } catch (error) {
            console.error(`Failed to send immediate notification:`, error);
          }
        }
      }
    }
  } catch (error) {
    console.error('Immediate notifications check failed:', error);
  }
}

/**
 * Initialize notification scheduler
 */
export function initNotificationScheduler() {
  console.log('📬 Initializing notification scheduler...');

  // Run daily digest every 15 minutes to catch users' preferred times
  // (Each run checks if it's within 15 minutes of user's preferred time)
  cron.schedule('*/15 * * * *', sendDailyDigest);
  console.log('✓ Daily digest scheduler started (runs every 15 minutes)');

  // Check for immediate notifications every 15 minutes
  cron.schedule('*/15 * * * *', sendImmediateNotifications);
  console.log('✓ Immediate notifications scheduler started (runs every 15 minutes)');

  // Run initial check after 1 minute
  setTimeout(() => {
    sendImmediateNotifications();
  }, 60000);
}
