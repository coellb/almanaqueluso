import { format } from "date-fns";
import ENV from "../env";

export interface TideExtreme {
  dt: number; // Unix timestamp
  date: string; // ISO datetime string
  height: number; // meters
  type: "High" | "Low";
}

export interface TideData {
  location: string;
  lat: number;
  lon: number;
  extremes: TideExtreme[];
  datum: string;
  copyright: string;
}

export interface PortugueseLocation {
  name: string;
  lat: number;
  lon: number;
  region: string;
}

// Major Portuguese coastal locations
export const PORTUGUESE_LOCATIONS: PortugueseLocation[] = [
  { name: "Lisboa", lat: 38.7223, lon: -9.1393, region: "Lisboa" },
  { name: "Porto (Leixões)", lat: 41.1833, lon: -8.7056, region: "Porto" },
  { name: "Faro", lat: 37.0194, lon: -7.9322, region: "Algarve" },
  { name: "Cascais", lat: 38.6979, lon: -9.4214, region: "Lisboa" },
  { name: "Setúbal", lat: 38.5244, lon: -8.8882, region: "Setúbal" },
  { name: "Peniche", lat: 39.3558, lon: -9.3811, region: "Leiria" },
  { name: "Lagos", lat: 37.1028, lon: -8.6731, region: "Algarve" },
  { name: "Viana do Castelo", lat: 41.6938, lon: -8.8360, region: "Viana do Castelo" },
  { name: "Albufeira", lat: 37.0887, lon: -8.2503, region: "Algarve" },
  { name: "Nazaré", lat: 39.6014, lon: -9.0706, region: "Leiria" },
];

class TideService {
  private static WORLDTIDES_API_BASE = "https://www.worldtides.info/api/v3";
  private cache: Map<string, { data: TideData; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours

  /**
   * Fetch tide predictions from WorldTides API
   * @param lat Latitude
   * @param lon Longitude
   * @param days Number of days to fetch (default 7)
   * @returns Tide data with extremes
   */
  async getTidePredictions(
    lat: number,
    lon: number,
    days: number = 7
  ): Promise<TideData> {
    const cacheKey = `${lat},${lon},${days}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`[TideService] Using cached tide data for ${lat},${lon}`);
      return cached.data;
    }

    const apiKey = ENV.WORLDTIDES_API_KEY;
    if (!apiKey) {
      throw new Error(
        "WORLDTIDES_API_KEY not configured. Please add API key to environment variables."
      );
    }

    try {
      const url = new URL(TideService.WORLDTIDES_API_BASE);
      url.searchParams.append("extremes", "true");
      url.searchParams.append("lat", lat.toString());
      url.searchParams.append("lon", lon.toString());
      url.searchParams.append("days", days.toString());
      url.searchParams.append("key", apiKey);

      console.log(
        `[TideService] Fetching tide data from WorldTides API for ${lat},${lon}`
      );

      const response = await fetch(url.toString());

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[TideService] API response error (${response.status}): ${errorText}`);
        throw new Error(
          `WorldTides API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const data = await response.json();

      if (data.error) {
        console.error(`[TideService] API data error:`, data);
        throw new Error(`WorldTides API error: ${data.error}`);
      }

      // Transform extremes to include ISO date strings
      const extremes: TideExtreme[] = (data.extremes || []).map(
        (extreme: any) => ({
          dt: extreme.dt,
          date: new Date(extreme.dt * 1000).toISOString(),
          height: extreme.height,
          type: extreme.type,
        })
      );

      const tideData: TideData = {
        location: this.getLocationName(lat, lon),
        lat,
        lon,
        extremes,
        datum: data.datum || "LAT",
        copyright: data.copyright || "WorldTides",
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: tideData,
        timestamp: Date.now(),
      });

      console.log(
        `[TideService] Successfully fetched ${extremes.length} tide extremes`
      );

      return tideData;
    } catch (error: any) {
      console.error("[TideService] Failed to fetch tide data:", error);
      throw new Error(`Failed to fetch tide data: ${error.message}`);
    }
  }

  /**
   * Get tide predictions for a Portuguese location by name
   */
  async getTidesByLocation(
    locationName: string,
    days: number = 7
  ): Promise<TideData> {
    const location = PORTUGUESE_LOCATIONS.find(
      (loc) => loc.name.toLowerCase() === locationName.toLowerCase()
    );

    if (!location) {
      throw new Error(
        `Location '${locationName}' not found. Available locations: ${PORTUGUESE_LOCATIONS.map((l) => l.name).join(", ")}`
      );
    }

    return this.getTidePredictions(location.lat, location.lon, days);
  }

  /**
   * Get next high and low tide for a location
   */
  async getNextTides(
    lat: number,
    lon: number
  ): Promise<{ nextHigh: TideExtreme | null; nextLow: TideExtreme | null }> {
    const tideData = await this.getTidePredictions(lat, lon, 2);
    const now = Date.now() / 1000; // Convert to Unix timestamp

    const futureTides = tideData.extremes.filter((tide) => tide.dt > now);

    const nextHigh =
      futureTides.find((tide) => tide.type === "High") || null;
    const nextLow = futureTides.find((tide) => tide.type === "Low") || null;

    return { nextHigh, nextLow };
  }

  /**
   * Get today's tide extremes for a location
   */
  async getTodaysTides(lat: number, lon: number): Promise<TideExtreme[]> {
    const tideData = await this.getTidePredictions(lat, lon, 1);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime() / 1000;
    const todayEnd = todayStart + 24 * 60 * 60;

    return tideData.extremes.filter(
      (tide) => tide.dt >= todayStart && tide.dt < todayEnd
    );
  }

  /**
   * Get location name from coordinates
   */
  private getLocationName(lat: number, lon: number): string {
    const location = PORTUGUESE_LOCATIONS.find(
      (loc) => Math.abs(loc.lat - lat) < 0.01 && Math.abs(loc.lon - lon) < 0.01
    );
    return location?.name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  }

  /**
   * Get all Portuguese locations with their coordinates
   */
  getLocations(): PortugueseLocation[] {
    return PORTUGUESE_LOCATIONS;
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.cache.clear();
    console.log("[TideService] Cache cleared");
  }
}

export const tideService = new TideService();
