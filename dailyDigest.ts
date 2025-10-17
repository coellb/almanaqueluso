import cron from "node-cron";
import { storage } from "../storage";
import { ConsoleNotificationService } from "../services/notificationService";
import { db } from "../db";
import { jobLogs } from "@shared/schema";
import { eq } from "drizzle-orm";

const notificationService = new ConsoleNotificationService();

export function startDailyDigestJob() {
  // Run every minute to check if any user needs their digest
  cron.schedule("* * * * *", async () => {
    const jobStartTime = new Date();
    const currentTime = jobStartTime.toTimeString().slice(0, 5); // HH:mm format

    let jobLogId: number | null = null;
    
    try {
      // Log job start
      const [logEntry] = await db.insert(jobLogs).values({
        jobName: "daily_digest",
        status: "started",
        startedAt: jobStartTime,
        details: { currentTime },
      }).returning();
      jobLogId = logEntry.id;

      // Get all users with daily digest enabled
      const allPreferences = await storage.getAllPreferences();
      const usersToNotify = allPreferences.filter(
        pref => pref.dailyDigestEnabled && pref.dailyDigestTime === currentTime
      );

      if (usersToNotify.length === 0) {
        // No users to notify - complete job silently
        await db.update(jobLogs)
          .set({
            status: "completed",
            completedAt: new Date(),
            duration: Date.now() - jobStartTime.getTime(),
            details: { currentTime, usersNotified: 0 },
          })
          .where(eq(jobLogs.id, jobLogId));
        return;
      }

      const results = [];
      for (const pref of usersToNotify) {
        const result = await sendDailyDigest(pref.userId);
        results.push(result);
      }

      // Log job completion
      const successCount = results.filter(r => r?.success).length;
      await db.update(jobLogs)
        .set({
          status: "completed",
          completedAt: new Date(),
          duration: Date.now() - jobStartTime.getTime(),
          details: {
            currentTime,
            usersNotified: usersToNotify.length,
            successCount,
            failedCount: results.length - successCount,
          },
        })
        .where({ id: jobLogId } as any);

    } catch (error: any) {
      console.error("Daily digest job error:", error);
      
      // Log job failure
      if (jobLogId) {
        await db.update(jobLogs)
          .set({
            status: "failed",
            completedAt: new Date(),
            duration: Date.now() - jobStartTime.getTime(),
            errorMessage: error.message,
          })
          .where(eq(jobLogs.id, jobLogId));
      }
    }
  });

  console.log("Daily digest job started - checking every minute");
}

async function sendDailyDigest(userId: number) {
  try {
    const user = await storage.getUser(userId);
    if (!user) return null;

    const preferences = await storage.getPreferences(userId);
    if (!preferences) return null;

    // Get today's events
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const events = await storage.getEvents({
      startDate: today.toISOString(),
      endDate: tomorrow.toISOString(),
    });

    // Filter events by user preferences
    const filteredEvents = events.filter((event) => {
      if (!preferences.eventTypes || preferences.eventTypes.length === 0) {
        return true; // Show all if no filter
      }
      return preferences.eventTypes.includes(event.type);
    });

    if (filteredEvents.length === 0) {
      console.log(`No events for user ${userId} - skipping digest`);
      return { success: true, userId, eventsCount: 0 };
    }

    // Send digest via notification service
    const result = await notificationService.sendDailyDigest({
      userId,
      email: user.email,
      events: filteredEvents.map(e => ({
        id: e.id,
        title: e.title,
        type: e.type,
        startAt: new Date(e.startAt),
        location: e.location,
      })),
      digestDate: today,
    });

    return { ...result, eventsCount: filteredEvents.length };
    
  } catch (error: any) {
    console.error(`Failed to send digest for user ${userId}:`, error);
    return { success: false, userId, error: error.message };
  }
}
