import cron from "node-cron";
import { tideService, PORTUGUESE_LOCATIONS } from "../services/tideService";
import { db } from "../db";
import { events, jobLogs } from "@shared/schema";
import { eq, and, gte, lte } from "drizzle-orm";

/**
 * Import tide events from WorldTides API for major Portuguese coastal cities.
 * Runs daily at 02:00 to import next 7 days of tide predictions.
 */
async function importTideEvents() {
  const startTime = Date.now();
  const jobName = "tide-import";

  // Log job start
  const [jobLog] = await db
    .insert(jobLogs)
    .values({
      jobName,
      status: "started",
      startedAt: new Date(),
    })
    .returning();

  try {
    console.log("\n=== Starting Tide Import Job ===");
    console.log(`Time: ${new Date().toISOString()}`);

    const importedTides: any[] = [];
    const errors: string[] = [];

    // Import tides for each Portuguese location
    for (const location of PORTUGUESE_LOCATIONS) {
      try {
        console.log(`\nFetching tides for ${location.name}...`);
        
        const tideData = await tideService.getTidePredictions(
          location.lat,
          location.lon,
          7 // Next 7 days
        );

        console.log(`  Found ${tideData.extremes.length} tide extremes`);

        // Import each tide extreme as an event
        for (const extreme of tideData.extremes) {
          const startAt = new Date(extreme.dt * 1000);
          
          // Check if this tide event already exists
          const existing = await db
            .select()
            .from(events)
            .where(
              and(
                eq(events.type, "tide"),
                eq(events.location, `${location.name}, ${location.region}`),
                gte(events.startAt, new Date(startAt.getTime() - 5 * 60 * 1000)), // 5 min before
                lte(events.startAt, new Date(startAt.getTime() + 5 * 60 * 1000))  // 5 min after
              )
            )
            .limit(1);

          if (existing.length > 0) {
            console.log(`  Skipping existing tide: ${extreme.type} at ${startAt.toLocaleString('pt-PT')}`);
            continue;
          }

          // Create new tide event
          const tideEvent = {
            type: "tide" as const,
            title: `Maré ${extreme.type === "High" ? "Alta" : "Baixa"} em ${location.name}`,
            description: `Maré ${extreme.type === "High" ? "alta" : "baixa"} de ${extreme.height.toFixed(2)}m`,
            startAt,
            location: `${location.name}, ${location.region}`,
            visibility: "PT",
            tags: ["maré", location.name.toLowerCase(), location.region.toLowerCase()],
            meta: {
              tideType: extreme.type,
              height: extreme.height,
              datum: tideData.datum,
              lat: location.lat,
              lon: location.lon,
            },
            source: "worldtides-api",
          };

          const [created] = await db.insert(events).values(tideEvent).returning();
          importedTides.push(created);
          
          console.log(`  ✓ Created: ${tideEvent.title} at ${startAt.toLocaleString('pt-PT')}`);
        }

      } catch (error: any) {
        const errorMsg = `Failed to import tides for ${location.name}: ${error.message}`;
        console.error(`  ✗ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    // Log completion
    const duration = Date.now() - startTime;
    
    await db
      .update(jobLogs)
      .set({
        status: "completed",
        completedAt: new Date(),
        duration,
        details: {
          imported: importedTides.length,
          locations: PORTUGUESE_LOCATIONS.length,
          errors: errors.length > 0 ? errors : undefined,
        },
      })
      .where(eq(jobLogs.id, jobLog.id));

    console.log(`\n=== Tide Import Job Completed ===`);
    console.log(`Imported: ${importedTides.length} tide events`);
    console.log(`Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log(`Errors: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log("Errors:", errors);
    }

  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    console.error("\n=== Tide Import Job Failed ===");
    console.error("Error:", error);

    await db
      .update(jobLogs)
      .set({
        status: "failed",
        completedAt: new Date(),
        duration,
        errorMessage: error.message,
        details: {
          error: error.stack,
        },
      })
      .where(eq(jobLogs.id, jobLog.id));
  }
}

/**
 * Schedule tide import job
 * Runs daily at 02:00 UTC (03:00 Lisbon time in winter, 04:00 in summer)
 */
export function startTideImportJob() {
  // Run daily at 02:00 UTC
  cron.schedule("0 2 * * *", () => {
    console.log("[Cron] Tide import job triggered");
    importTideEvents().catch(console.error);
  });

  console.log("Tide import job scheduled - runs daily at 02:00 UTC");

  // Optional: Run immediately on startup for testing (comment out in production)
  if (process.env.NODE_ENV === "development") {
    console.log("[Dev] Running tide import job immediately for testing...");
    setTimeout(() => {
      importTideEvents().catch(console.error);
    }, 5000); // Wait 5 seconds after server starts
  }
}
