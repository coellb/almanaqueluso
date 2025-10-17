import { format } from "date-fns";
import ENV from "../env";

export interface FootballTeam {
  id: number;
  name: string;
  logo: string;
}

export interface FootballFixture {
  fixture: {
    id: number;
    referee: string | null;
    timezone: string;
    date: string; // ISO datetime
    timestamp: number;
    venue: {
      id: number | null;
      name: string | null;
      city: string | null;
    };
    status: {
      long: string;
      short: string;
      elapsed: number | null;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
    season: number;
    round: string;
  };
  teams: {
    home: FootballTeam;
    away: FootballTeam;
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    halftime: { home: number | null; away: number | null };
    fulltime: { home: number | null; away: number | null };
    extratime: { home: number | null; away: number | null };
    penalty: { home: number | null; away: number | null };
  };
}

export interface Competition {
  id: number;
  name: string;
  type: "match_liga" | "uefa" | "fifa";
  apiLeagueId: number;
}

// Portuguese and major European competitions
export const COMPETITIONS: Competition[] = [
  // Portuguese League
  { id: 1, name: "Liga Portugal", type: "match_liga", apiLeagueId: 94 },
  { id: 2, name: "Taça de Portugal", type: "match_liga", apiLeagueId: 96 },
  { id: 3, name: "Taça da Liga", type: "match_liga", apiLeagueId: 97 },
  
  // UEFA Competitions
  { id: 10, name: "UEFA Champions League", type: "uefa", apiLeagueId: 2 },
  { id: 11, name: "UEFA Europa League", type: "uefa", apiLeagueId: 3 },
  { id: 12, name: "UEFA Conference League", type: "uefa", apiLeagueId: 848 },
  
  // FIFA Competitions
  { id: 20, name: "FIFA World Cup", type: "fifa", apiLeagueId: 1 },
  { id: 21, name: "FIFA Club World Cup", type: "fifa", apiLeagueId: 15 },
];

class FootballService {
  private static API_BASE = "https://v3.football.api-sports.io";
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours

  /**
   * Fetch fixtures for a specific league and season
   */
  async getFixtures(
    leagueId: number,
    season: number = new Date().getFullYear(),
    from?: string,
    to?: string
  ): Promise<FootballFixture[]> {
    const cacheKey = `fixtures-${leagueId}-${season}-${from}-${to}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`[FootballService] Using cached fixtures for league ${leagueId}`);
      return cached.data;
    }

    const apiKey = ENV.FOOTBALL_API_KEY;
    if (!apiKey) {
      throw new Error(
        "FOOTBALL_API_KEY not configured. Please add API key to environment variables."
      );
    }

    try {
      const url = new URL(`${FootballService.API_BASE}/fixtures`);
      url.searchParams.append("league", leagueId.toString());
      url.searchParams.append("season", season.toString());
      if (from) url.searchParams.append("from", from);
      if (to) url.searchParams.append("to", to);

      console.log(
        `[FootballService] Fetching fixtures for league ${leagueId}, season ${season}`
      );

      const response = await fetch(url.toString(), {
        headers: {
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": "v3.football.api-sports.io",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[FootballService] API response error (${response.status}): ${errorText}`
        );
        throw new Error(
          `Football API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      if (data.errors && Object.keys(data.errors).length > 0) {
        console.error(`[FootballService] API data error:`, data.errors);
        throw new Error(`Football API error: ${JSON.stringify(data.errors)}`);
      }

      const fixtures = data.response || [];

      // Cache the result
      this.cache.set(cacheKey, {
        data: fixtures,
        timestamp: Date.now(),
      });

      console.log(
        `[FootballService] Successfully fetched ${fixtures.length} fixtures`
      );

      return fixtures;
    } catch (error: any) {
      console.error("[FootballService] Failed to fetch fixtures:", error);
      throw new Error(`Failed to fetch fixtures: ${error.message}`);
    }
  }

  /**
   * Get upcoming fixtures for a competition
   */
  async getUpcomingFixtures(
    competitionType: "match_liga" | "uefa" | "fifa",
    days: number = 30
  ): Promise<FootballFixture[]> {
    const competitions = COMPETITIONS.filter((c) => c.type === competitionType);
    const allFixtures: FootballFixture[] = [];

    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    const from = format(today, "yyyy-MM-dd");
    const to = format(futureDate, "yyyy-MM-dd");

    for (const competition of competitions) {
      try {
        const fixtures = await this.getFixtures(
          competition.apiLeagueId,
          today.getFullYear(),
          from,
          to
        );
        allFixtures.push(...fixtures);
      } catch (error) {
        console.error(
          `Failed to fetch fixtures for ${competition.name}:`,
          error
        );
      }
    }

    // Sort by date
    return allFixtures.sort(
      (a, b) => a.fixture.timestamp - b.fixture.timestamp
    );
  }

  /**
   * Get fixtures for Liga Portugal
   */
  async getLigaPortugalFixtures(days: number = 30): Promise<FootballFixture[]> {
    return this.getUpcomingFixtures("match_liga", days);
  }

  /**
   * Get fixtures for UEFA competitions
   */
  async getUEFAFixtures(days: number = 30): Promise<FootballFixture[]> {
    return this.getUpcomingFixtures("uefa", days);
  }

  /**
   * Get fixtures for FIFA competitions
   */
  async getFIFAFixtures(days: number = 30): Promise<FootballFixture[]> {
    return this.getUpcomingFixtures("fifa", days);
  }

  /**
   * Get all available competitions
   */
  getCompetitions(): Competition[] {
    return COMPETITIONS;
  }

  /**
   * Get competition by league ID
   */
  getCompetitionByLeagueId(leagueId: number): Competition | undefined {
    return COMPETITIONS.find((c) => c.apiLeagueId === leagueId);
  }

  /**
   * Check if a fixture involves Portuguese teams
   */
  isPortugueseMatch(fixture: FootballFixture): boolean {
    const portugueseTeams = [
      "FC Porto",
      "Benfica",
      "Sporting CP",
      "Braga",
      "Vitória SC",
      "Boavista",
      "Gil Vicente",
      "Casa Pia",
      "Famalicão",
      "Estoril",
      "Arouca",
      "Chaves",
      "Portimonense",
      "Rio Ave",
      "Santa Clara",
      "Vizela",
      "Moreirense",
      "Estrela",
    ];

    return (
      portugueseTeams.some((team) =>
        fixture.teams.home.name.includes(team)
      ) ||
      portugueseTeams.some((team) => fixture.teams.away.name.includes(team))
    );
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.cache.clear();
    console.log("[FootballService] Cache cleared");
  }
}

export const footballService = new FootballService();
