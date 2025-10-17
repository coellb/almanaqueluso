export interface MoonPhaseData {
  phase: number; // 0-1 where 0=new, 0.25=first quarter, 0.5=full, 0.75=last quarter
  illumination: number; // 0-100 percentage
  phaseName: string; // "Lua Nova", "Quarto Crescente", etc.
  nextPhase: {
    name: string;
    date: Date;
  } | null;
}

export interface SunTimes {
  sunrise: Date;
  sunset: Date;
  solarNoon: Date;
  dayLength: number; // in seconds
  civilTwilightBegin: Date;
  civilTwilightEnd: Date;
}

export interface MoonTimes {
  moonrise: Date | null;
  moonset: Date | null;
}

export interface Eclipse {
  type: "solar" | "lunar";
  eclipseType: "total" | "partial" | "annular" | "penumbral";
  date: Date;
  visibleFromPortugal: boolean;
  description: string;
}

export interface SeasonalEvent {
  type: "equinox" | "solstice";
  season: "spring" | "summer" | "autumn" | "winter";
  date: Date;
  name: string;
}

export interface ZodiacSign {
  sign: string;
  symbol: string;
  dateRange: string;
  element: string;
  constellation: string;
}

interface USNOMoonPhase {
  phase: string; // "New Moon", "First Quarter", "Full Moon", "Last Quarter"
  year: number;
  month: number;
  day: number;
  time: string;   // "12:36"
}

export class AstronomyService {
  private static USNO_API_BASE = "https://aa.usno.navy.mil/api";
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  async getMoonPhase(date: Date = new Date()): Promise<MoonPhaseData> {
    try {
      const phases = await this.getYearPhases(date.getFullYear());
      return await this.calculateCurrentPhase(date, phases);
    } catch (error) {
      console.error("Failed to fetch moon phase, using fallback calculation:", error);
      return this.fallbackMoonPhase(date);
    }
  }

  private async getYearPhases(year: number): Promise<USNOMoonPhase[]> {
    const cacheKey = `moon_phases_${year}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    const response = await fetch(`${AstronomyService.USNO_API_BASE}/moon/phases/year?year=${year}`);
    
    if (!response.ok) {
      throw new Error(`USNO API error: ${response.status}`);
    }

    const data = await response.json();
    const phases = data.phasedata || [];
    
    this.cache.set(cacheKey, { data: phases, timestamp: Date.now() });
    return phases;
  }

  private async calculateCurrentPhase(date: Date, phases: USNOMoonPhase[]): Promise<MoonPhaseData> {
    // Convert phases to timestamps
    const phaseTimestamps = phases.map(p => ({
      ...p,
      timestamp: new Date(Date.UTC(p.year, p.month - 1, p.day, parseInt(p.time.split(':')[0]), parseInt(p.time.split(':')[1]))).getTime(),
    }));

    const currentTime = date.getTime();
    
    // Find the last phase before current date
    let lastPhase = phaseTimestamps
      .filter(p => p.timestamp <= currentTime)
      .sort((a, b) => b.timestamp - a.timestamp)[0];
    
    // If no lastPhase (early in year), fetch previous year
    if (!lastPhase) {
      try {
        const prevYearPhases = await this.getYearPhases(date.getFullYear() - 1);
        const prevYearTimestamps = prevYearPhases.map(p => ({
          ...p,
          timestamp: new Date(Date.UTC(p.year, p.month - 1, p.day, parseInt(p.time.split(':')[0]), parseInt(p.time.split(':')[1]))).getTime(),
        }));
        
        lastPhase = prevYearTimestamps
          .filter(p => p.timestamp <= currentTime)
          .sort((a, b) => b.timestamp - a.timestamp)[0];
      } catch (error) {
        console.error("Failed to fetch previous year phases:", error);
      }
    }

    if (!lastPhase) {
      return this.fallbackMoonPhase(date);
    }
    
    // Find the next phase after current date
    let nextPhase = phaseTimestamps
      .filter(p => p.timestamp > currentTime)
      .sort((a, b) => a.timestamp - b.timestamp)[0];

    // If no nextPhase (late in year), fetch next year
    if (!nextPhase) {
      try {
        const nextYearPhases = await this.getYearPhases(date.getFullYear() + 1);
        const nextYearTimestamps = nextYearPhases.map(p => ({
          ...p,
          timestamp: new Date(Date.UTC(p.year, p.month - 1, p.day, parseInt(p.time.split(':')[0]), parseInt(p.time.split(':')[1]))).getTime(),
        }));
        
        nextPhase = nextYearTimestamps
          .filter(p => p.timestamp > currentTime)
          .sort((a, b) => a.timestamp - b.timestamp)[0];
      } catch (error) {
        console.error("Failed to fetch next year phases:", error);
      }
    }

    // Calculate phase progress
    const lunarCycle = 29.53 * 24 * 60 * 60 * 1000; // ~29.53 days in ms
    const timeSinceLastPhase = currentTime - lastPhase.timestamp;
    const phaseProgress = (timeSinceLastPhase / lunarCycle) % 1;

    // Map USNO phase names to our phase values
    const phaseMap: Record<string, number> = {
      "New Moon": 0,
      "First Quarter": 0.25,
      "Full Moon": 0.5,
      "Last Quarter": 0.75,
    };

    const basePhase = phaseMap[lastPhase.phase] || 0;
    const phase = (basePhase + phaseProgress) % 1;

    const { phaseName, illumination } = this.getPhaseDetails(phase);

    return {
      phase,
      illumination,
      phaseName,
      nextPhase: nextPhase ? {
        name: this.translatePhaseName(nextPhase.phase),
        date: new Date(nextPhase.timestamp),
      } : null,
    };
  }

  private getPhaseDetails(phase: number): { phaseName: string; illumination: number } {
    let phaseName: string;
    
    if (phase < 0.03 || phase > 0.97) {
      phaseName = "Lua Nova";
    } else if (phase < 0.22) {
      phaseName = "Lua Crescente";
    } else if (phase < 0.28) {
      phaseName = "Quarto Crescente";
    } else if (phase < 0.47) {
      phaseName = "Lua Crescente Gibosa";
    } else if (phase < 0.53) {
      phaseName = "Lua Cheia";
    } else if (phase < 0.72) {
      phaseName = "Lua Minguante Gibosa";
    } else if (phase < 0.78) {
      phaseName = "Quarto Minguante";
    } else {
      phaseName = "Lua Minguante";
    }

    // Calculate illumination percentage
    const illumination = Math.round(Math.abs(Math.cos(phase * 2 * Math.PI)) * 100);

    return { phaseName, illumination };
  }

  private translatePhaseName(usnoPhase: string): string {
    const translations: Record<string, string> = {
      "New Moon": "Lua Nova",
      "First Quarter": "Quarto Crescente",
      "Full Moon": "Lua Cheia",
      "Last Quarter": "Quarto Minguante",
    };
    return translations[usnoPhase] || usnoPhase;
  }

  // Fallback calculation (same as original widget logic)
  private fallbackMoonPhase(date: Date): MoonPhaseData {
    const lunarMonth = 29.53;
    const referenceNewMoon = new Date(2000, 0, 6);
    const daysSinceReference = (date.getTime() - referenceNewMoon.getTime()) / (1000 * 60 * 60 * 24);
    const phase = (daysSinceReference % lunarMonth) / lunarMonth;

    const { phaseName, illumination } = this.getPhaseDetails(phase);

    return {
      phase,
      illumination,
      phaseName,
      nextPhase: null,
    };
  }

  /**
   * Get sun rise/set times for a specific location and date
   * Default location: Lisbon, Portugal (38.7223° N, 9.1393° W)
   */
  async getSunTimes(
    lat: number = 38.7223,
    lng: number = -9.1393,
    date: Date = new Date()
  ): Promise<SunTimes> {
    const cacheKey = `sun_times_${lat}_${lng}_${date.toISOString().split('T')[0]}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const dateStr = date.toISOString().split('T')[0];
      const response = await fetch(
        `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lng}&date=${dateStr}&formatted=0`
      );
      
      if (!response.ok) {
        throw new Error(`Sunrise API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status !== "OK") {
        throw new Error(`Sunrise API returned status: ${data.status}`);
      }

      const sunTimes: SunTimes = {
        sunrise: new Date(data.results.sunrise),
        sunset: new Date(data.results.sunset),
        solarNoon: new Date(data.results.solar_noon),
        dayLength: data.results.day_length,
        civilTwilightBegin: new Date(data.results.civil_twilight_begin),
        civilTwilightEnd: new Date(data.results.civil_twilight_end),
      };

      this.cache.set(cacheKey, { data: sunTimes, timestamp: Date.now() });
      return sunTimes;
    } catch (error) {
      console.error("Failed to fetch sun times:", error);
      throw new Error("Failed to fetch sun times");
    }
  }

  /**
   * Get moon rise/set times using suncalc library
   * Provides accurate calculations based on observer location
   */
  async getMoonTimes(
    lat: number = 38.7223,
    lng: number = -9.1393,
    date: Date = new Date()
  ): Promise<MoonTimes> {
    // Using suncalc for accurate astronomical calculations
    const SunCalc = (await import("suncalc")).default;
    const moonTimes = SunCalc.getMoonTimes(date, lat, lng);
    
    return {
      moonrise: moonTimes.rise || null,
      moonset: moonTimes.set || null,
    };
  }

  /**
   * Get eclipses for a specific year (curated data for 2025)
   */
  getEclipses(year: number = 2025): Eclipse[] {
    const eclipses2025: Eclipse[] = [
      {
        type: "lunar",
        eclipseType: "total",
        date: new Date("2025-03-14T06:30:00Z"),
        visibleFromPortugal: true,
        description: "Eclipse Total da Lua - Visível de Portugal ao amanhecer",
      },
      {
        type: "solar",
        eclipseType: "partial",
        date: new Date("2025-03-29T10:00:00Z"),
        visibleFromPortugal: false,
        description: "Eclipse Parcial do Sol - Visível do Atlântico Norte",
      },
      {
        type: "lunar",
        eclipseType: "total",
        date: new Date("2025-09-07T18:30:00Z"),
        visibleFromPortugal: true,
        description: "Eclipse Total da Lua - Visível de Portugal ao anoitecer",
      },
      {
        type: "solar",
        eclipseType: "partial",
        date: new Date("2025-09-21T19:45:00Z"),
        visibleFromPortugal: false,
        description: "Eclipse Parcial do Sol - Visível do Pacífico Sul",
      },
    ];

    if (year === 2025) {
      return eclipses2025;
    }

    return [];
  }

  /**
   * Get equinoxes and solstices for a specific year
   */
  getSeasonalEvents(year: number = 2025): SeasonalEvent[] {
    const events2025: SeasonalEvent[] = [
      {
        type: "equinox",
        season: "spring",
        date: new Date("2025-03-20T09:01:00Z"),
        name: "Equinócio da Primavera",
      },
      {
        type: "solstice",
        season: "summer",
        date: new Date("2025-06-21T02:42:00Z"),
        name: "Solstício de Verão",
      },
      {
        type: "equinox",
        season: "autumn",
        date: new Date("2025-09-22T18:19:00Z"),
        name: "Equinócio de Outono",
      },
      {
        type: "solstice",
        season: "winter",
        date: new Date("2025-12-21T15:03:00Z"),
        name: "Solstício de Inverno",
      },
    ];

    if (year === 2025) {
      return events2025;
    }

    return [];
  }

  /**
   * Get zodiac sign for a specific date
   */
  getZodiacSign(date: Date = new Date()): ZodiacSign {
    const month = date.getMonth() + 1;
    const day = date.getDate();

    const zodiacSigns: ZodiacSign[] = [
      { sign: "Capricórnio", symbol: "♑", dateRange: "22 Dez - 19 Jan", element: "Terra", constellation: "Capricornus" },
      { sign: "Aquário", symbol: "♒", dateRange: "20 Jan - 18 Fev", element: "Ar", constellation: "Aquarius" },
      { sign: "Peixes", symbol: "♓", dateRange: "19 Fev - 20 Mar", element: "Água", constellation: "Pisces" },
      { sign: "Carneiro", symbol: "♈", dateRange: "21 Mar - 19 Abr", element: "Fogo", constellation: "Aries" },
      { sign: "Touro", symbol: "♉", dateRange: "20 Abr - 20 Mai", element: "Terra", constellation: "Taurus" },
      { sign: "Gémeos", symbol: "♊", dateRange: "21 Mai - 20 Jun", element: "Ar", constellation: "Gemini" },
      { sign: "Caranguejo", symbol: "♋", dateRange: "21 Jun - 22 Jul", element: "Água", constellation: "Cancer" },
      { sign: "Leão", symbol: "♌", dateRange: "23 Jul - 22 Ago", element: "Fogo", constellation: "Leo" },
      { sign: "Virgem", symbol: "♍", dateRange: "23 Ago - 22 Set", element: "Terra", constellation: "Virgo" },
      { sign: "Balança", symbol: "♎", dateRange: "23 Set - 22 Out", element: "Ar", constellation: "Libra" },
      { sign: "Escorpião", symbol: "♏", dateRange: "23 Out - 21 Nov", element: "Água", constellation: "Scorpius" },
      { sign: "Sagitário", symbol: "♐", dateRange: "22 Nov - 21 Dez", element: "Fogo", constellation: "Sagittarius" },
    ];

    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return zodiacSigns[0];
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return zodiacSigns[1];
    if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return zodiacSigns[2];
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return zodiacSigns[3];
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return zodiacSigns[4];
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return zodiacSigns[5];
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return zodiacSigns[6];
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return zodiacSigns[7];
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return zodiacSigns[8];
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return zodiacSigns[9];
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return zodiacSigns[10];
    return zodiacSigns[11]; // Sagitário
  }

  /**
   * Get visible constellations for a specific month (Portugal location)
   */
  getConstellations(month: number): string[] {
    const constellationsByMonth: Record<number, string[]> = {
      1: ["Orion", "Touro", "Gémeos", "Cão Maior", "Cão Menor"],
      2: ["Orion", "Touro", "Gémeos", "Cão Maior", "Auriga"],
      3: ["Leão", "Hydra", "Cão Menor", "Gémeos", "Ursa Maior"],
      4: ["Leão", "Virgem", "Ursa Maior", "Boieiro", "Coroa Boreal"],
      5: ["Virgem", "Boieiro", "Ursa Maior", "Coroa Boreal", "Hércules"],
      6: ["Hércules", "Escorpião", "Ophiuchus", "Coroa Boreal", "Lira"],
      7: ["Escorpião", "Sagitário", "Ophiuchus", "Aquila", "Cisne"],
      8: ["Sagitário", "Aquila", "Cisne", "Lira", "Delfim"],
      9: ["Aquila", "Cisne", "Pégaso", "Aquário", "Capricórnio"],
      10: ["Pégaso", "Andrómeda", "Peixes", "Aquário", "Capricórnio"],
      11: ["Andrómeda", "Perseu", "Carneiro", "Peixes", "Baleia"],
      12: ["Perseu", "Touro", "Orion", "Carneiro", "Plêiades"],
    };

    return constellationsByMonth[month] || [];
  }
}

export const astronomyService = new AstronomyService();
