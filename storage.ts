// Referenced from javascript_database blueprint integration
import { users, events, preferences, type User, type InsertUser, type Event, type InsertEvent, type Preferences, type InsertPreferences } from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Omit<InsertUser, 'password'> & { passwordHash: string }): Promise<User>;
  updateUserSubscription(userId: number, data: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    subscriptionStatus?: string;
    subscriptionPlan?: string;
  }): Promise<User>;

  // Event operations
  getEvents(filters?: { types?: string[]; startDate?: Date | string; endDate?: Date | string }): Promise<Event[]>;
  getEventById(id: number): Promise<Event | undefined>;
  createEvent(event: Omit<InsertEvent, 'startAt' | 'endAt'> & { startAt: Date; endAt?: Date }, userId?: number): Promise<Event>;

  // Preferences operations
  getPreferences(userId: number): Promise<Preferences | undefined>;
  getAllPreferences(): Promise<Preferences[]>;
  upsertPreferences(userId: number, prefs: InsertPreferences): Promise<Preferences>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(user: Omit<InsertUser, 'password'> & { passwordHash: string }): Promise<User> {
    const [newUser] = await db
      .insert(users)
      .values(user)
      .returning();
    return newUser;
  }

  async updateUserSubscription(userId: number, data: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    subscriptionStatus?: string;
    subscriptionPlan?: string;
  }): Promise<User> {
    const [updated] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async getEvents(filters?: { types?: string[]; startDate?: Date | string; endDate?: Date | string }): Promise<Event[]> {
    let query = db.select().from(events);
    
    const conditions = [];
    
    if (filters?.types && filters.types.length > 0) {
      conditions.push(inArray(events.type, filters.types));
    }
    
    if (filters?.startDate) {
      const startDate = typeof filters.startDate === 'string' ? new Date(filters.startDate) : filters.startDate;
      conditions.push(gte(events.startAt, startDate));
    }
    
    if (filters?.endDate) {
      const endDate = typeof filters.endDate === 'string' ? new Date(filters.endDate) : filters.endDate;
      conditions.push(lte(events.startAt, endDate));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query;
  }

  async getAllPreferences(): Promise<Preferences[]> {
    return await db.select().from(preferences);
  }

  async getEventById(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event || undefined;
  }

  async createEvent(event: Omit<InsertEvent, 'startAt' | 'endAt'> & { startAt: Date; endAt?: Date }, userId?: number): Promise<Event> {
    const [newEvent] = await db
      .insert(events)
      .values({
        ...event,
        createdBy: userId,
      })
      .returning();
    return newEvent;
  }

  async getPreferences(userId: number): Promise<Preferences | undefined> {
    const [prefs] = await db.select().from(preferences).where(eq(preferences.userId, userId));
    return prefs || undefined;
  }

  async upsertPreferences(userId: number, prefs: InsertPreferences): Promise<Preferences> {
    const existing = await this.getPreferences(userId);
    
    if (existing) {
      const [updated] = await db
        .update(preferences)
        .set({ ...prefs, updatedAt: new Date() })
        .where(eq(preferences.userId, userId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(preferences)
        .values({ ...prefs, userId })
        .returning();
      return created;
    }
  }
}

export const storage = new DatabaseStorage();
