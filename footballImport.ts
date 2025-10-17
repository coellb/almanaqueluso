import cron from "node-cron";
import { footballService, COMPETITIONS } from "../services/footballService";
import { db } from "../db";
import { events, jobLogs } from "@shared/schema";
import { eq, and, gte } from "drizzle-orm";

/**
 * Import football matches from Football API for Portuguese and major competitions.
 * Runs daily at 03:00 to import next 30 days of matches.
 */
async function importFootballMatches() {
  const startTime = Date.now();
  const jobName = "football-import";

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
    console.log("\n=== Starting Football Import Job ===");
    console.log(`Time: ${new Date().toISOString()}`);

    const importedMatches: any[] = [];
    const errors: string[] = [];

    // Import Liga Portugal matches
    try {
      console.log("\nFetching Liga Portugal matches...");
      const ligaMatches = await footballService.getLigaPortugalFixtures(30);
      console.log(`  Found ${ligaMatches.length} Liga Portugal fixtures`);

      for (const match of ligaMatches) {
        try {
          const startAt = new Date(match.fixture.date);
          
          // Check if match already exists
          const existing = await db
            .select()
            .from(events)
            .where(
              and(
                eq(events.type, "match_liga"),
                eq(events.title, `${match.teams.home.name} vs ${match.teams.away.name}`),
                gte(events.startAt, new Date(startAt.getTime() - 60 * 60 * 1000)) // 1 hour window
              )
            )
            .limit(1);

          if (existing.length > 0) {
            console.log(`  Skipping existing match: ${match.teams.home.name} vs ${match.teams.away.name}`);
            continue;
          }

          // Create match event
          const matchEvent = {
            type: "match_liga" as const,
            title: `${match.teams.home.name} vs ${match.teams.away.name}`,
            description: `${match.league.name} - ${match.league.round}`,
            startAt,
            location: match.fixture.venue.name 
              ? `${match.fixture.venue.name}, ${match.fixture.venue.city}` 
              : match.fixture.venue.city || "A definir",
            visibility: "PT",
            tags: ["futebol", "liga portugal", match.teams.home.name.toLowerCase(), match.teams.away.name.toLowerCase()],
            meta: {
              fixtureId: match.fixture.id,
              homeTeam: match.teams.home.name,
              homeTeamLogo: match.teams.home.logo,
              awayTeam: match.teams.away.name,
              awayTeamLogo: match.teams.away.logo,
              league: match.league.name,
              leagueId: match.league.id,
              season: match.league.season,
              round: match.league.round,
              referee: match.fixture.referee,
              status: match.fixture.status.long,
            },
            source: "football-api",
          };

          const [created] = await db.insert(events).values(matchEvent).returning();
          importedMatches.push(created);
          
          console.log(`  ✓ Created: ${matchEvent.title}`);
        } catch (error: any) {
          console.error(`  ✗ Failed to import match:`, error.message);
          errors.push(`Match import error: ${error.message}`);
        }
      }
    } catch (error: any) {
      const errorMsg = `Failed to fetch Liga Portugal matches: ${error.message}`;
      console.error(`  ✗ ${errorMsg}`);
      errors.push(errorMsg);
    }

    // Import UEFA matches (Champions League, Europa League, Conference League)
    try {
      console.log("\nFetching UEFA matches...");
      const uefaMatches = await footballService.getUEFAFixtures(30);
      
      // Filter for Portuguese teams or all matches if none
      const relevantMatches = uefaMatches.filter(match => 
        footballService.isPortugueseMatch(match)
      );
      
      console.log(`  Found ${relevantMatches.length} relevant UEFA fixtures with Portuguese teams`);

      for (const match of relevantMatches) {
        try {
          const startAt = new Date(match.fixture.date);
          
          const existing = await db
            .select()
            .from(events)
            .where(
              and(
                eq(events.type, "uefa"),
                eq(events.title, `${match.teams.home.name} vs ${match.teams.away.name}`),
                gte(events.startAt, new Date(startAt.getTime() - 60 * 60 * 1000))
              )
            )
            .limit(1);

          if (existing.length > 0) {
            console.log(`  Skipping existing UEFA match: ${match.teams.home.name} vs ${match.teams.away.name}`);
            continue;
          }

          const matchEvent = {
            type: "uefa" as const,
            title: `${match.teams.home.name} vs ${match.teams.away.name}`,
            description: `${match.league.name} - ${match.league.round}`,
            startAt,
            location: match.fixture.venue.name 
              ? `${match.fixture.venue.name}, ${match.fixture.venue.city}` 
              : match.fixture.venue.city || "A definir",
            visibility: "PT",
            tags: ["futebol", "uefa", match.league.name.toLowerCase(), match.teams.home.name.toLowerCase(), match.teams.away.name.toLowerCase()],
            meta: {
              fixtureId: match.fixture.id,
              homeTeam: match.teams.home.name,
              homeTeamLogo: match.teams.home.logo,
              awayTeam: match.teams.away.name,
              awayTeamLogo: match.teams.away.logo,
              league: match.league.name,
              leagueId: match.league.id,
              season: match.league.season,
              round: match.league.round,
              referee: match.fixture.referee,
              status: match.fixture.status.long,
            },
            source: "football-api",
          };

          const [created] = await db.insert(events).values(matchEvent).returning();
          importedMatches.push(created);
          
          console.log(`  ✓ Created: ${matchEvent.title}`);
        } catch (error: any) {
          console.error(`  ✗ Failed to import UEFA match:`, error.message);
          errors.push(`UEFA match import error: ${error.message}`);
        }
      }
    } catch (error: any) {
      const errorMsg = `Failed to fetch UEFA matches: ${error.message}`;
      console.error(`  ✗ ${errorMsg}`);
      errors.push(errorMsg);
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
          imported: importedMatches.length,
          competitions: COMPETITIONS.length,
          errors: errors.length > 0 ? errors : undefined,
        },
      })
      .where(eq(jobLogs.id, jobLog.id));

    console.log(`\n=== Football Import Job Completed ===`);
    console.log(`Imported: ${importedMatches.length} matches`);
    console.log(`Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log(`Errors: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log("Errors:", errors);
    }

  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    console.error("\n=== Football Import Job Failed ===");
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
 * Schedule football import job
 * Runs daily at 03:00 UTC (04:00 Lisbon time in winter, 05:00 in summer)
 */
export function startFootballImportJob() {
  // Run daily at 03:00 UTC
  cron.schedule("0 3 * * *", () => {
    console.log("[Cron] Football import job triggered");
    importFootballMatches().catch(console.error);
  });

  console.log("Football import job scheduled - runs daily at 03:00 UTC");

  // Optional: Run immediately on startup for testing (comment out in production)
  if (process.env.NODE_ENV === "development") {
    console.log("[Dev] Running football import job immediately for testing...");
    setTimeout(() => {
      importFootballMatches().catch(console.error);
    }, 8000); // Wait 8 seconds after server starts
  }
}
