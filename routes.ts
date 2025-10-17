import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { insertUserSchema, loginSchema, insertEventSchema, insertPreferencesSchema } from "@shared/schema";
import { subscriptionPlans, isPremiumPlan } from "@shared/subscriptionPlans";
import Stripe from "stripe";
import { authLimiter, apiLimiter } from "./middleware/rateLimiter";
import { db } from "./db";
import { astronomyService } from "./services/astronomyService";
import { tideService } from "./services/tideService";
import { footballService } from "./services/footballService";
import { wisdomService } from "./services/wisdomService";
import { portugueseCalendarService } from "./services/portugueseCalendarService";
import { agricultureService } from "./services/agricultureService";
import { cultureService } from "./services/cultureService";
import { PushNotificationService } from "./services/pushNotificationService";
import { pushSubscriptions, notificationPreferences, insertPushSubscriptionSchema, insertNotificationPreferencesSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import ENV from "./env";

const JWT_SECRET = ENV.JWT_SECRET;
const JWT_EXPIRES_IN = "7d";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required. Please set it in your environment.");
}

// Middleware to verify JWT token
interface AuthRequest extends Request {
  userId?: number;
}

const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", async (_req: Request, res: Response) => {
    let dbStatus = "connected";
    try {
      // Test database connection with a simple query
      const result = await storage.getEvents({ types: [], startDate: new Date().toISOString() });
      if (!result) throw new Error("Query failed");
    } catch (error) {
      dbStatus = "error";
    }
      
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: "1.0.0",
      database: dbStatus,
    });
  });

  // Stripe config endpoint - returns public key for frontend (safe to expose)
  app.get("/api/stripe/config", async (_req: Request, res: Response) => {
    res.json({
      publicKey: ENV.STRIPE_PUBLIC_KEY,
    });
  });

  // Diagnostics endpoint to validate environment variables (development only)
  app.get("/api/_diagnostics/env", async (_req: Request, res: Response) => {
    // Security: Only available in development mode
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ message: "Not found" });
    }
    
    const mask = (s: string) => s ? `${s.slice(0, 7)}... (len:${s.length})` : "(empty)";
    
    res.setHeader('Content-Type', 'application/json');
    res.json({
      stripe_secret_key: mask(ENV.STRIPE_SECRET_KEY),
      stripe_public_key: mask(ENV.STRIPE_PUBLIC_KEY),
      vapid_public_key: mask(ENV.VAPID_PUBLIC_KEY),
      vapid_private_key: mask(ENV.VAPID_PRIVATE_KEY),
      jwt_secret: mask(ENV.JWT_SECRET),
      worldtides_api_key: mask(ENV.WORLDTIDES_API_KEY),
      football_api_key: mask(ENV.FOOTBALL_API_KEY),
      node_env: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  });

  // Auth endpoints with rate limiting
  app.post("/api/auth/register", authLimiter, async (req: Request, res: Response) => {
    try {
      const data = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existing = await storage.getUserByEmail(data.email);
      if (existing) {
        return res.status(400).json({ message: "Email já está registado" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(data.password, 10);

      // Create user
      const user = await storage.createUser({
        email: data.email,
        timezone: data.timezone || "Europe/Lisbon",
        passwordHash,
      });

      // Generate JWT
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

      // Create default preferences
      await storage.upsertPreferences(user.id, {
        dailyDigestEnabled: true,
        dailyDigestTime: "08:30",
        eventTypes: [],
        notificationChannels: ["push"],
      });

      const { passwordHash: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, token });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(400).json({ message: error.message || "Erro ao criar conta" });
    }
  });

  app.post("/api/auth/login", authLimiter, async (req: Request, res: Response) => {
    try {
      const data = loginSchema.parse(req.body);

      // Find user
      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        return res.status(401).json({ message: "Email ou password incorretos" });
      }

      // Verify password
      const isValid = await bcrypt.compare(data.password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Email ou password incorretos" });
      }

      // Generate JWT
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

      const { passwordHash: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, token });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(400).json({ message: error.message || "Erro no login" });
    }
  });

  app.get("/api/auth/me", authLimiter, authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { passwordHash: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Event endpoints with rate limiting
  app.get("/api/events", apiLimiter, async (req: Request, res: Response) => {
    try {
      const { types, startDate, endDate } = req.query;

      const filters: any = {};
      
      if (types) {
        filters.types = Array.isArray(types) ? types : [types];
      }
      
      if (startDate) {
        filters.startDate = new Date(startDate as string);
      }
      
      if (endDate) {
        filters.endDate = new Date(endDate as string);
      }

      const events = await storage.getEvents(filters);
      res.json(events);
    } catch (error: any) {
      console.error("Get events error:", error);
      res.status(500).json({ message: "Erro ao obter eventos" });
    }
  });

  app.get("/api/events/:id", apiLimiter, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const event = await storage.getEventById(id);
      
      if (!event) {
        return res.status(404).json({ message: "Evento não encontrado" });
      }
      
      res.json(event);
    } catch (error: any) {
      console.error("Get event error:", error);
      res.status(500).json({ message: "Erro ao obter evento" });
    }
  });

  app.post("/api/events", apiLimiter, authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const data = insertEventSchema.parse(req.body);
      
      const event = await storage.createEvent({
        ...data,
        startAt: new Date(data.startAt),
        endAt: data.endAt ? new Date(data.endAt) : undefined,
      }, req.userId);
      
      res.json(event);
    } catch (error: any) {
      console.error("Create event error:", error);
      res.status(400).json({ message: error.message || "Erro ao criar evento" });
    }
  });

  // Astronomy endpoints
  app.get("/api/astronomy/moon-phase", apiLimiter, async (req: Request, res: Response) => {
    try {
      const dateParam = req.query.date as string | undefined;
      const date = dateParam ? new Date(dateParam) : new Date();
      
      const phaseData = await astronomyService.getMoonPhase(date);
      res.json(phaseData);
    } catch (error: any) {
      console.error("Get moon phase error:", error);
      res.status(500).json({ message: "Erro ao obter fase lunar" });
    }
  });

  // Tide endpoints
  app.get("/api/tides/predictions", apiLimiter, async (req: Request, res: Response) => {
    try {
      const location = req.query.location as string | undefined;
      const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
      const lon = req.query.lon ? parseFloat(req.query.lon as string) : undefined;
      const days = req.query.days ? parseInt(req.query.days as string) : 7;

      let tideData;

      if (location) {
        tideData = await tideService.getTidesByLocation(location, days);
      } else if (lat !== undefined && lon !== undefined) {
        tideData = await tideService.getTidePredictions(lat, lon, days);
      } else {
        // Default to Lisbon
        tideData = await tideService.getTidesByLocation("Lisboa", days);
      }

      res.json(tideData);
    } catch (error: any) {
      console.error("Get tide predictions error:", error);
      res.status(500).json({ message: error.message || "Erro ao obter previsões de marés" });
    }
  });

  app.get("/api/tides/locations", apiLimiter, async (req: Request, res: Response) => {
    try {
      const locations = tideService.getLocations();
      res.json(locations);
    } catch (error: any) {
      console.error("Get tide locations error:", error);
      res.status(500).json({ message: "Erro ao obter localizações" });
    }
  });

  app.get("/api/tides/next", apiLimiter, async (req: Request, res: Response) => {
    try {
      const location = req.query.location as string | undefined;
      const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
      const lon = req.query.lon ? parseFloat(req.query.lon as string) : undefined;

      let nextTides;

      if (location) {
        const loc = tideService.getLocations().find(
          l => l.name.toLowerCase() === location.toLowerCase()
        );
        if (!loc) {
          return res.status(404).json({ message: "Localização não encontrada" });
        }
        nextTides = await tideService.getNextTides(loc.lat, loc.lon);
      } else if (lat !== undefined && lon !== undefined) {
        nextTides = await tideService.getNextTides(lat, lon);
      } else {
        // Default to Lisbon
        const lisbon = tideService.getLocations().find(l => l.name === "Lisboa")!;
        nextTides = await tideService.getNextTides(lisbon.lat, lisbon.lon);
      }

      res.json(nextTides);
    } catch (error: any) {
      console.error("Get next tides error:", error);
      res.status(500).json({ message: error.message || "Erro ao obter próximas marés" });
    }
  });

  // Football endpoints
  app.get("/api/football/fixtures/liga", apiLimiter, async (req: Request, res: Response) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const fixtures = await footballService.getLigaPortugalFixtures(days);
      res.json(fixtures);
    } catch (error: any) {
      console.error("Get Liga Portugal fixtures error:", error);
      res.status(500).json({ message: error.message || "Erro ao obter jogos da Liga Portugal" });
    }
  });

  app.get("/api/football/fixtures/uefa", apiLimiter, async (req: Request, res: Response) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const fixtures = await footballService.getUEFAFixtures(days);
      res.json(fixtures);
    } catch (error: any) {
      console.error("Get UEFA fixtures error:", error);
      res.status(500).json({ message: error.message || "Erro ao obter jogos UEFA" });
    }
  });

  app.get("/api/football/fixtures/fifa", apiLimiter, async (req: Request, res: Response) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const fixtures = await footballService.getFIFAFixtures(days);
      res.json(fixtures);
    } catch (error: any) {
      console.error("Get FIFA fixtures error:", error);
      res.status(500).json({ message: error.message || "Erro ao obter jogos FIFA" });
    }
  });

  app.get("/api/football/competitions", apiLimiter, async (req: Request, res: Response) => {
    try {
      const competitions = footballService.getCompetitions();
      res.json(competitions);
    } catch (error: any) {
      console.error("Get competitions error:", error);
      res.status(500).json({ message: "Erro ao obter competições" });
    }
  });

  // Wisdom & Folk Culture endpoints
  app.get("/api/wisdom/daily", apiLimiter, async (req: Request, res: Response) => {
    try {
      const wisdom = wisdomService.getDailyWisdom();
      res.json(wisdom);
    } catch (error: any) {
      console.error("Get daily wisdom error:", error);
      res.status(500).json({ message: "Erro ao obter sabedoria do dia" });
    }
  });

  app.get("/api/wisdom/proverbs", apiLimiter, async (req: Request, res: Response) => {
    try {
      const month = req.query.month ? parseInt(req.query.month as string) : new Date().getMonth() + 1;
      const proverbs = wisdomService.getProverbsForMonth(month);
      res.json({ month, proverbs });
    } catch (error: any) {
      console.error("Get proverbs error:", error);
      res.status(500).json({ message: "Erro ao obter provérbios" });
    }
  });

  app.get("/api/wisdom/saint", apiLimiter, async (req: Request, res: Response) => {
    try {
      const day = req.query.day ? parseInt(req.query.day as string) : new Date().getDate();
      const month = req.query.month ? parseInt(req.query.month as string) : new Date().getMonth() + 1;
      const saint = wisdomService.getSaintOfDay(day, month);
      res.json(saint);
    } catch (error: any) {
      console.error("Get saint error:", error);
      res.status(500).json({ message: "Erro ao obter santo do dia" });
    }
  });

  app.get("/api/wisdom/recipe", apiLimiter, async (req: Request, res: Response) => {
    try {
      const month = req.query.month ? parseInt(req.query.month as string) : new Date().getMonth() + 1;
      const recipe = wisdomService.getRecipeForMonth(month);
      res.json(recipe);
    } catch (error: any) {
      console.error("Get recipe error:", error);
      res.status(500).json({ message: "Erro ao obter receita" });
    }
  });

  app.get("/api/wisdom/traditions", apiLimiter, async (req: Request, res: Response) => {
    try {
      const month = req.query.month ? parseInt(req.query.month as string) : undefined;
      const traditions = month 
        ? wisdomService.getTraditionsForMonth(month)
        : wisdomService.getUpcomingTraditions();
      res.json(traditions);
    } catch (error: any) {
      console.error("Get traditions error:", error);
      res.status(500).json({ message: "Erro ao obter tradições" });
    }
  });

  app.get("/api/wisdom/superstitions", apiLimiter, async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string | undefined;
      const superstitions = wisdomService.getSuperstitions(category);
      res.json(superstitions);
    } catch (error: any) {
      console.error("Get superstitions error:", error);
      res.status(500).json({ message: "Erro ao obter superstições" });
    }
  });

  // Astronomy endpoints - Sun & Moon times
  app.get("/api/astronomy/sun-times", apiLimiter, async (req: Request, res: Response) => {
    try {
      const lat = req.query.lat ? parseFloat(req.query.lat as string) : 38.7223;
      const lng = req.query.lng ? parseFloat(req.query.lng as string) : -9.1393;
      const dateParam = req.query.date as string | undefined;
      const date = dateParam ? new Date(dateParam) : new Date();
      
      const sunTimes = await astronomyService.getSunTimes(lat, lng, date);
      res.json(sunTimes);
    } catch (error: any) {
      console.error("Get sun times error:", error);
      res.status(500).json({ message: "Erro ao obter horários do sol" });
    }
  });

  app.get("/api/astronomy/moon-times", apiLimiter, async (req: Request, res: Response) => {
    try {
      const lat = req.query.lat ? parseFloat(req.query.lat as string) : 38.7223;
      const lng = req.query.lng ? parseFloat(req.query.lng as string) : -9.1393;
      const dateParam = req.query.date as string | undefined;
      const date = dateParam ? new Date(dateParam) : new Date();
      
      const moonTimes = await astronomyService.getMoonTimes(lat, lng, date);
      res.json(moonTimes);
    } catch (error: any) {
      console.error("Get moon times error:", error);
      res.status(500).json({ message: "Erro ao obter horários da lua" });
    }
  });

  app.get("/api/astronomy/eclipses", apiLimiter, async (req: Request, res: Response) => {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : 2025;
      const eclipses = astronomyService.getEclipses(year);
      res.json(eclipses);
    } catch (error: any) {
      console.error("Get eclipses error:", error);
      res.status(500).json({ message: "Erro ao obter eclipses" });
    }
  });

  app.get("/api/astronomy/seasonal-events", apiLimiter, async (req: Request, res: Response) => {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : 2025;
      const events = astronomyService.getSeasonalEvents(year);
      res.json(events);
    } catch (error: any) {
      console.error("Get seasonal events error:", error);
      res.status(500).json({ message: "Erro ao obter equinócios e solstícios" });
    }
  });

  app.get("/api/astronomy/zodiac", apiLimiter, async (req: Request, res: Response) => {
    try {
      const dateParam = req.query.date as string | undefined;
      const date = dateParam ? new Date(dateParam) : new Date();
      const zodiacSign = astronomyService.getZodiacSign(date);
      res.json(zodiacSign);
    } catch (error: any) {
      console.error("Get zodiac sign error:", error);
      res.status(500).json({ message: "Erro ao obter signo do zodíaco" });
    }
  });

  app.get("/api/astronomy/constellations", apiLimiter, async (req: Request, res: Response) => {
    try {
      const month = req.query.month ? parseInt(req.query.month as string) : new Date().getMonth() + 1;
      const constellations = astronomyService.getConstellations(month);
      res.json({ month, constellations });
    } catch (error: any) {
      console.error("Get constellations error:", error);
      res.status(500).json({ message: "Erro ao obter constelações" });
    }
  });

  // Portuguese Calendar endpoints
  app.get("/api/calendar/holidays", apiLimiter, async (req: Request, res: Response) => {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : 2025;
      const month = req.query.month ? parseInt(req.query.month as string) : undefined;
      
      const holidays = month 
        ? portugueseCalendarService.getHolidaysForMonth(year, month)
        : portugueseCalendarService.getHolidays(year);
      res.json(holidays);
    } catch (error: any) {
      console.error("Get holidays error:", error);
      res.status(500).json({ message: "Erro ao obter feriados" });
    }
  });

  app.get("/api/calendar/ephemerides", apiLimiter, async (req: Request, res: Response) => {
    try {
      const month = req.query.month ? parseInt(req.query.month as string) : undefined;
      const day = req.query.day ? parseInt(req.query.day as string) : undefined;
      
      const ephemerides = (month && day)
        ? portugueseCalendarService.getEphemerisForDate(month, day)
        : portugueseCalendarService.getHistoricalEphemerides();
      res.json(ephemerides);
    } catch (error: any) {
      console.error("Get ephemerides error:", error);
      res.status(500).json({ message: "Erro ao obter efemérides" });
    }
  });

  app.get("/api/calendar/is-holiday", apiLimiter, async (req: Request, res: Response) => {
    try {
      const dateParam = req.query.date as string | undefined;
      const date = dateParam ? new Date(dateParam) : new Date();
      const holiday = portugueseCalendarService.isHoliday(date);
      res.json({ date, isHoliday: !!holiday, holiday });
    } catch (error: any) {
      console.error("Check holiday error:", error);
      res.status(500).json({ message: "Erro ao verificar feriado" });
    }
  });

  // Agriculture & Nature endpoints
  app.get("/api/agriculture/monthly-calendar", apiLimiter, async (req: Request, res: Response) => {
    try {
      const month = req.query.month ? parseInt(req.query.month as string) : undefined;
      const calendar = month 
        ? agricultureService.getMonthlyCalendar(month)
        : agricultureService.getCurrentMonthTasks();
      res.json(calendar);
    } catch (error: any) {
      console.error("Get monthly calendar error:", error);
      res.status(500).json({ message: "Erro ao obter calendário agrícola" });
    }
  });

  app.get("/api/agriculture/pruning-grafting", apiLimiter, async (req: Request, res: Response) => {
    try {
      const current = req.query.current === 'true';
      const tasks = current 
        ? agricultureService.getCurrentPruningTasks()
        : agricultureService.getPruningGrafting();
      res.json(tasks);
    } catch (error: any) {
      console.error("Get pruning/grafting error:", error);
      res.status(500).json({ message: "Erro ao obter podas e enxertias" });
    }
  });

  app.get("/api/agriculture/vineyards-olive-groves", apiLimiter, async (req: Request, res: Response) => {
    try {
      const current = req.query.current === 'true';
      const tasks = current
        ? agricultureService.getCurrentVineyardOliveTasks()
        : agricultureService.getVineyardOliveCare();
      res.json(tasks);
    } catch (error: any) {
      console.error("Get vineyard/olive tasks error:", error);
      res.status(500).json({ message: "Erro ao obter tratamento de vinhas e olivais" });
    }
  });

  app.get("/api/agriculture/gardening", apiLimiter, async (req: Request, res: Response) => {
    try {
      const month = req.query.month ? parseInt(req.query.month as string) : undefined;
      const advice = month
        ? agricultureService.getGardeningAdvice(month)
        : agricultureService.getCurrentGardeningAdvice();
      res.json(advice);
    } catch (error: any) {
      console.error("Get gardening advice error:", error);
      res.status(500).json({ message: "Erro ao obter conselhos de jardinagem" });
    }
  });

  app.get("/api/agriculture/livestock", apiLimiter, async (req: Request, res: Response) => {
    try {
      const current = req.query.current === 'true';
      const care = current
        ? agricultureService.getCurrentLivestockCare()
        : agricultureService.getLivestockCare();
      res.json(care);
    } catch (error: any) {
      console.error("Get livestock care error:", error);
      res.status(500).json({ message: "Erro ao obter cuidados com criação" });
    }
  });

  app.get("/api/agriculture/beekeeping", apiLimiter, async (req: Request, res: Response) => {
    try {
      const month = req.query.month ? parseInt(req.query.month as string) : undefined;
      const tasks = month
        ? agricultureService.getBeekeepingTasks(month)
        : agricultureService.getCurrentBeekeepingTasks();
      res.json(tasks);
    } catch (error: any) {
      console.error("Get beekeeping tasks error:", error);
      res.status(500).json({ message: "Erro ao obter tarefas de apicultura" });
    }
  });

  app.get("/api/agriculture/lunar-influence", apiLimiter, async (req: Request, res: Response) => {
    try {
      const phase = req.query.phase as string | undefined;
      const influences = phase
        ? agricultureService.getLunarInfluenceByPhase(phase)
        : agricultureService.getLunarInfluences();
      res.json(influences);
    } catch (error: any) {
      console.error("Get lunar influence error:", error);
      res.status(500).json({ message: "Erro ao obter influência lunar" });
    }
  });

  app.get("/api/agriculture/weather-practices", apiLimiter, async (req: Request, res: Response) => {
    try {
      const weatherType = req.query.type as string | undefined;
      const practices = weatherType
        ? agricultureService.getPracticesByWeather(weatherType)
        : agricultureService.getWeatherPractices();
      res.json(practices);
    } catch (error: any) {
      console.error("Get weather practices error:", error);
      res.status(500).json({ message: "Erro ao obter práticas por tempo" });
    }
  });

  // Culture & Society endpoints
  app.get("/api/culture/weather-predictions", apiLimiter, async (req: Request, res: Response) => {
    try {
      const predictions = cultureService.getSymbolicWeatherPredictions();
      res.json(predictions);
    } catch (error: any) {
      console.error("Get weather predictions error:", error);
      res.status(500).json({ message: "Erro ao obter previsões simbólicas" });
    }
  });

  app.get("/api/culture/poetry", apiLimiter, async (req: Request, res: Response) => {
    try {
      const random = req.query.random === 'true';
      const poetry = random 
        ? cultureService.getRandomPoetry()
        : cultureService.getRuralPoetry();
      res.json(poetry);
    } catch (error: any) {
      console.error("Get poetry error:", error);
      res.status(500).json({ message: "Erro ao obter poesia" });
    }
  });

  app.get("/api/culture/curiosities", apiLimiter, async (req: Request, res: Response) => {
    try {
      const random = req.query.random === 'true';
      const curiosities = random
        ? cultureService.getRandomCuriosity()
        : cultureService.getScientificCuriosities();
      res.json(curiosities);
    } catch (error: any) {
      console.error("Get curiosities error:", error);
      res.status(500).json({ message: "Erro ao obter curiosidades" });
    }
  });

  app.get("/api/culture/regions", apiLimiter, async (req: Request, res: Response) => {
    try {
      const district = req.query.district as string | undefined;
      const regions = district
        ? cultureService.getRegionByDistrict(district)
        : cultureService.getAgriculturalRegions();
      res.json(regions);
    } catch (error: any) {
      console.error("Get agricultural regions error:", error);
      res.status(500).json({ message: "Erro ao obter regiões agrícolas" });
    }
  });

  app.get("/api/culture/astrology", apiLimiter, async (req: Request, res: Response) => {
    try {
      const sign = req.query.sign as string | undefined;
      const astrology = sign
        ? cultureService.getAstrologyBySign(sign)
        : cultureService.getDailyAstrology();
      res.json(astrology);
    } catch (error: any) {
      console.error("Get astrology error:", error);
      res.status(500).json({ message: "Erro ao obter astrologia" });
    }
  });

  // Preferences endpoints with rate limiting
  app.get("/api/preferences", apiLimiter, authenticate, async (req: AuthRequest, res: Response) => {
    try {
      let prefs = await storage.getPreferences(req.userId!);
      
      // Create default preferences if they don't exist
      if (!prefs) {
        prefs = await storage.upsertPreferences(req.userId!, {
          dailyDigestEnabled: true,
          dailyDigestTime: "08:30",
          eventTypes: [],
          notificationChannels: ["push"],
        });
      }
      
      res.json(prefs);
    } catch (error: any) {
      console.error("Get preferences error:", error);
      res.status(500).json({ message: "Erro ao obter preferências" });
    }
  });

  app.put("/api/preferences", apiLimiter, authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const data = insertPreferencesSchema.parse(req.body);
      const prefs = await storage.upsertPreferences(req.userId!, data);
      res.json(prefs);
    } catch (error: any) {
      console.error("Update preferences error:", error);
      res.status(400).json({ message: error.message || "Erro ao guardar preferências" });
    }
  });

  // Stripe subscription routes (only if API keys are configured)
  let stripe: Stripe | null = null;
  
  // Using ENV loader to work around Replit Secrets bug with underscores
  // ENV tries aliases without underscores first (STRIPESECRETKEY), then falls back to STRIPE_SECRET_KEY
  const stripeSecretKey = ENV.STRIPE_SECRET_KEY;
  const stripePublicKey = ENV.STRIPE_PUBLIC_KEY;
  
  if (stripeSecretKey && stripePublicKey) {
    console.log(`[Stripe] Initializing with key prefix: ${stripeSecretKey.substring(0, 7)}...`);
    stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-09-30.clover",
    });

    // Get subscription plans
    app.get("/api/subscription/plans", apiLimiter, async (_req: Request, res: Response) => {
      try {
        // Inject Stripe Price IDs from environment variables and filter unavailable plans
        const plansWithPriceIds = subscriptionPlans.map(plan => {
          if (plan.id === 'premium') {
            return {
              ...plan,
              stripePriceId: process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
              available: !!process.env.STRIPE_PRICE_PREMIUM_MONTHLY
            };
          } else if (plan.id === 'premium_annual') {
            return {
              ...plan,
              stripePriceId: process.env.STRIPE_PRICE_PREMIUM_YEARLY,
              available: !!process.env.STRIPE_PRICE_PREMIUM_YEARLY
            };
          }
          return { ...plan, available: true }; // Free plan is always available
        }).filter(plan => plan.available !== false); // Only return available plans
        
        res.json(plansWithPriceIds);
      } catch (error: any) {
        console.error("Get subscription plans error:", error);
        res.status(500).json({ message: "Erro ao obter planos de subscrição" });
      }
    });

    // Get user subscription status
    app.get("/api/subscription/status", apiLimiter, authenticate, async (req: AuthRequest, res: Response) => {
      try {
        const user = await storage.getUser(req.userId!);
        if (!user) {
          return res.status(404).json({ message: "Utilizador não encontrado" });
        }

        let subscriptionData = null;
        if (user.stripeSubscriptionId && stripe) {
          try {
            const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
            subscriptionData = {
              id: subscription.id,
              status: subscription.status,
              currentPeriodEnd: (subscription as any).current_period_end,
              cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
            };
          } catch (error) {
            console.error("Failed to retrieve Stripe subscription:", error);
          }
        }

        res.json({
          plan: user.subscriptionPlan || 'free',
          status: user.subscriptionStatus || 'free',
          stripeSubscription: subscriptionData,
          isPremium: isPremiumPlan(user.subscriptionPlan || 'free'),
        });
      } catch (error: any) {
        console.error("Get subscription status error:", error);
        res.status(500).json({ message: "Erro ao obter estado da subscrição" });
      }
    });

    // Create subscription
    app.post("/api/subscription/create", apiLimiter, authenticate, async (req: AuthRequest, res: Response) => {
      if (!stripe) {
        return res.status(503).json({ message: "Serviço de pagamentos não disponível" });
      }

      try {
        const { planId } = req.body;
        const user = await storage.getUser(req.userId!);
        
        if (!user) {
          return res.status(404).json({ message: "Utilizador não encontrado" });
        }

        const plan = subscriptionPlans.find(p => p.id === planId);
        if (!plan) {
          return res.status(400).json({ message: "Plano inválido" });
        }

        // Get Stripe Price ID from environment variables
        let stripePriceId: string | undefined;
        if (planId === 'premium') {
          stripePriceId = process.env.STRIPE_PRICE_PREMIUM_MONTHLY;
        } else if (planId === 'premium_annual') {
          stripePriceId = process.env.STRIPE_PRICE_PREMIUM_YEARLY;
        }

        if (!stripePriceId) {
          return res.status(400).json({ message: "Plano não disponível para subscrição" });
        }

        // Create or retrieve Stripe customer
        let customerId = user.stripeCustomerId;
        if (!customerId) {
          const customer = await stripe.customers.create({
            email: user.email,
            metadata: { userId: user.id.toString() },
          });
          customerId = customer.id;
          await storage.updateUserSubscription(user.id, { stripeCustomerId: customerId });
        }

        // Create subscription
        const subscription = await stripe.subscriptions.create({
          customer: customerId,
          items: [{ price: stripePriceId }],
          payment_behavior: 'default_incomplete',
          payment_settings: { 
            save_default_payment_method: 'on_subscription',
            payment_method_types: ['card', 'multibanco'], // MB WAY via Multibanco for Portugal
          },
          expand: ['latest_invoice.payment_intent'],
        });

        // Update user subscription info
        await storage.updateUserSubscription(user.id, {
          stripeSubscriptionId: subscription.id,
          subscriptionStatus: subscription.status,
          subscriptionPlan: planId,
        });

        const latestInvoice = subscription.latest_invoice as any;
        const paymentIntent = latestInvoice?.payment_intent as any;

        res.json({
          subscriptionId: subscription.id,
          clientSecret: paymentIntent?.client_secret,
        });
      } catch (error: any) {
        console.error("Create subscription error:", error);
        res.status(500).json({ message: error.message || "Erro ao criar subscrição" });
      }
    });

    // Cancel subscription
    app.post("/api/subscription/cancel", apiLimiter, authenticate, async (req: AuthRequest, res: Response) => {
      if (!stripe) {
        return res.status(503).json({ message: "Serviço de pagamentos não disponível" });
      }

      try {
        const user = await storage.getUser(req.userId!);
        
        if (!user || !user.stripeSubscriptionId) {
          return res.status(404).json({ message: "Subscrição não encontrada" });
        }

        // Cancel at period end
        const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });

        res.json({
          message: "Subscrição cancelada no fim do período",
          cancelAt: subscription.cancel_at,
        });
      } catch (error: any) {
        console.error("Cancel subscription error:", error);
        res.status(500).json({ message: error.message || "Erro ao cancelar subscrição" });
      }
    });

    // Stripe webhook (to handle subscription updates)
    app.post("/api/stripe/webhook", async (req: Request, res: Response) => {
      if (!stripe) {
        return res.status(503).json({ message: "Serviço de pagamentos não disponível" });
      }

      const sig = req.headers['stripe-signature'];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!sig) {
        return res.status(400).json({ message: "Missing stripe signature" });
      }

      try {
        let event: Stripe.Event;

        if (webhookSecret) {
          event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        } else {
          event = req.body;
        }

        // Handle the event
        switch (event.type) {
          case 'payment_intent.succeeded': {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            const userId = paymentIntent.metadata?.userId;
            const type = paymentIntent.metadata?.type;

            if (userId && type === 'lifetime_premium') {
              console.log(`✅ Payment succeeded for user ${userId} - Granting lifetime premium access`);
              
              // Update user to have lifetime premium access
              await storage.updateUserSubscription(parseInt(userId), {
                subscriptionStatus: 'lifetime',
                subscriptionPlan: 'premium',
              });
              
              console.log(`✅ User ${userId} now has lifetime premium access`);
            }
            break;
          }
          case 'customer.subscription.updated':
          case 'customer.subscription.deleted': {
            const subscription = event.data.object as Stripe.Subscription;
            const customerId = subscription.customer as string;

            // Find user by Stripe customer ID
            // Note: This requires a query - you may want to add getUserByStripeCustomerId to storage
            const status = subscription.status === 'active' ? 'active' 
                        : subscription.status === 'past_due' ? 'past_due'
                        : subscription.status === 'canceled' ? 'canceled'
                        : 'free';

            // Update user subscription status
            // For now, we'll log it - implement getUserByStripeCustomerId if needed
            console.log(`Subscription ${subscription.id} status changed to ${status} for customer ${customerId}`);
            break;
          }
          default:
            console.log(`Unhandled event type ${event.type}`);
        }

        res.json({ received: true });
      } catch (error: any) {
        console.error("Webhook error:", error);
        res.status(400).json({ message: `Webhook Error: ${error.message}` });
      }
    });

    // One-time payment routes (for €0.99 lifetime premium access)
    const ONETIME_PRICE_ID = 'price_1SIvXwRpbVFydAd7YUN79rf6'; // €0.99 one-time payment
    
    // Create one-time payment
    app.post("/api/payment/create", apiLimiter, authenticate, async (req: AuthRequest, res: Response) => {
      if (!stripe) {
        return res.status(503).json({ message: "Serviço de pagamentos não disponível" });
      }

      try {
        const user = await storage.getUser(req.userId!);
        
        if (!user) {
          return res.status(404).json({ message: "Utilizador não encontrado" });
        }

        // Check if user already has premium access
        if (user.subscriptionStatus === 'active' || user.subscriptionStatus === 'lifetime') {
          return res.status(400).json({ message: "Já tem acesso premium" });
        }

        // Create or retrieve Stripe customer
        let customerId = user.stripeCustomerId;
        if (!customerId) {
          const customer = await stripe.customers.create({
            email: user.email,
            metadata: { userId: user.id.toString() },
          });
          customerId = customer.id;
          await storage.updateUserSubscription(user.id, { stripeCustomerId: customerId });
        }

        // Create payment intent for one-time payment
        // automatic_payment_methods enables all activated methods in Stripe dashboard
        // Note: To enable MB WAY (Multibanco), activate it at: https://dashboard.stripe.com/settings/payment_methods
        const paymentIntent = await stripe.paymentIntents.create({
          amount: 99, // €0.99 in cents
          currency: 'eur',
          customer: customerId,
          automatic_payment_methods: {
            enabled: true,
          },
          metadata: {
            userId: user.id.toString(),
            type: 'lifetime_premium',
          },
        });

        res.json({
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
        });
      } catch (error: any) {
        console.error("Create payment error:", error);
        res.status(500).json({ message: error.message || "Erro ao criar pagamento" });
      }
    });

    // Get one-time payment info
    app.get("/api/payment/info", apiLimiter, (_req: Request, res: Response) => {
      res.json({
        price: 0.99,
        currency: 'EUR',
        description: 'Acesso Premium Vitalício',
        features: [
          'Acesso completo a todas as funcionalidades',
          'Marés e desportos (Liga Portugal, UEFA)',
          'Eventos culturais portugueses',
          'Calendário agrícola completo',
          'Notificações avançadas',
          'Sem anúncios',
          'Acesso vitalício - pague uma vez',
        ],
      });
    });
  } else {
    console.warn("⚠️  Stripe API keys not configured. Payment features will be unavailable.");
  }

  // Push Notification Routes
  
  // Get VAPID public key
  app.get("/api/push/vapid-public-key", (_req: Request, res: Response) => {
    res.json({ publicKey: PushNotificationService.getPublicKey() });
  });

  // Subscribe to push notifications
  app.post("/api/push/subscribe", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const subscriptionData = insertPushSubscriptionSchema.parse({
        ...req.body,
        userId,
      });

      // Check if subscription already exists
      const existing = await db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, subscriptionData.endpoint))
        .limit(1);

      if (existing.length > 0) {
        // Update existing subscription
        await db
          .update(pushSubscriptions)
          .set({
            keys: subscriptionData.keys,
            userAgent: subscriptionData.userAgent,
          })
          .where(eq(pushSubscriptions.endpoint, subscriptionData.endpoint));
      } else {
        // Create new subscription
        await db.insert(pushSubscriptions).values(subscriptionData);
      }

      res.json({ success: true, message: "Subscription registered successfully" });
    } catch (error: any) {
      console.error("Push subscription error:", error);
      res.status(500).json({ message: error.message || "Failed to register subscription" });
    }
  });

  // Check push subscription status
  app.get("/api/push/subscription-status", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;

      const subscription = await db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.userId, userId))
        .limit(1);

      res.json({ 
        isSubscribed: subscription.length > 0,
        subscription: subscription[0] || null 
      });
    } catch (error: any) {
      console.error("Push status check error:", error);
      res.status(500).json({ message: error.message || "Failed to check subscription status" });
    }
  });

  // Unsubscribe from push notifications
  app.post("/api/push/unsubscribe", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const { endpoint } = req.body;

      await db
        .delete(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, endpoint));

      res.json({ success: true, message: "Unsubscribed successfully" });
    } catch (error: any) {
      console.error("Push unsubscribe error:", error);
      res.status(500).json({ message: error.message || "Failed to unsubscribe" });
    }
  });

  // Get notification preferences
  app.get("/api/notifications/preferences", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;

      const prefs = await db
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, userId))
        .limit(1);

      if (prefs.length === 0) {
        // Return default preferences
        res.json({
          tidesEnabled: true,
          sportsEnabled: true,
          astronomyEnabled: true,
          agricultureEnabled: false,
          culturalEnabled: true,
          holidaysEnabled: true,
          tidesFrequency: 'immediate',
          sportsFrequency: 'daily',
          astronomyFrequency: 'daily',
          agricultureFrequency: 'weekly',
          culturalFrequency: 'weekly',
          holidaysFrequency: 'daily',
          preferredNotificationTime: '09:00',
          quietHoursStart: '22:00',
          quietHoursEnd: '08:00',
        });
      } else {
        res.json(prefs[0]);
      }
    } catch (error: any) {
      console.error("Get preferences error:", error);
      res.status(500).json({ message: error.message || "Failed to get preferences" });
    }
  });

  // Update notification preferences
  app.put("/api/notifications/preferences", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const prefsData = insertNotificationPreferencesSchema.parse(req.body);

      // Check if preferences exist
      const existing = await db
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, userId))
        .limit(1);

      if (existing.length > 0) {
        // Update existing preferences
        await db
          .update(notificationPreferences)
          .set({
            ...prefsData,
            updatedAt: new Date(),
          })
          .where(eq(notificationPreferences.userId, userId));
      } else {
        // Create new preferences
        await db.insert(notificationPreferences).values({
          ...prefsData,
          userId,
        });
      }

      res.json({ success: true, message: "Preferences updated successfully" });
    } catch (error: any) {
      console.error("Update preferences error:", error);
      res.status(500).json({ message: error.message || "Failed to update preferences" });
    }
  });

  // Test notification endpoint (for debugging)
  app.post("/api/push/test", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      
      await PushNotificationService.sendToUser(userId, {
        title: 'Teste AlmanaqueLuso',
        body: 'Esta é uma notificação de teste!',
        url: '/dashboard',
        tag: 'test-notification',
      });

      res.json({ success: true, message: "Test notification sent" });
    } catch (error: any) {
      console.error("Test notification error:", error);
      res.status(500).json({ message: error.message || "Failed to send test notification" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
