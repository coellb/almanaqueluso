import { pgTable, serial, text, timestamp, boolean, jsonb, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  timezone: text("timezone").default("Europe/Lisbon"),
  role: text("role").default("USER"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status").default("free"), // free, active, past_due, canceled
  subscriptionPlan: text("subscription_plan").default("free"), // free, premium, premium_annual
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Events table
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // astronomy, event_pt, match_liga, uefa, fifa, tide, moon, custom
  title: text("title").notNull(),
  description: text("description"),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }),
  location: text("location"),
  visibility: text("visibility").default("PT"),
  tags: text("tags").array(),
  meta: jsonb("meta").$type<Record<string, any>>(),
  source: text("source").default("manual"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Preferences table
export const preferences = pgTable("preferences", {
  userId: integer("user_id").primaryKey().references(() => users.id),
  eventTypes: text("event_types").array(),
  dailyDigestEnabled: boolean("daily_digest_enabled").default(true),
  dailyDigestTime: text("daily_digest_time").default("08:30"),
  notificationChannels: text("notification_channels").array().default(["push"]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  events: many(events),
  preferences: one(preferences),
}));

export const eventsRelations = relations(events, ({ one }) => ({
  creator: one(users, {
    fields: [events.createdBy],
    references: [users.id],
  }),
}));

export const preferencesRelations = relations(preferences, ({ one }) => ({
  user: one(users, {
    fields: [preferences.userId],
    references: [users.id],
  }),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  passwordHash: true,
  createdAt: true,
}).extend({
  email: z.string().email(),
  password: z.string().min(8),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  type: z.enum(["astronomy", "event_pt", "match_liga", "uefa", "fifa", "tide", "moon", "custom"]),
  title: z.string().min(1),
  startAt: z.string().datetime(),
  endAt: z.string().datetime().optional(),
});

export const insertPreferencesSchema = createInsertSchema(preferences).omit({
  userId: true,
  createdAt: true,
  updatedAt: true,
});

// TypeScript types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginCredentials = z.infer<typeof loginSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Preferences = typeof preferences.$inferSelect;
export type InsertPreferences = z.infer<typeof insertPreferencesSchema>;

export type EventType = "astronomy" | "event_pt" | "match_liga" | "uefa" | "fifa" | "tide" | "moon" | "custom";

// Job execution logs table
export const jobLogs = pgTable("job_logs", {
  id: serial("id").primaryKey(),
  jobName: text("job_name").notNull(),
  status: text("status").notNull(), // 'started', 'completed', 'failed'
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  duration: integer("duration"), // in milliseconds
  details: jsonb("details").$type<Record<string, any>>(),
  errorMessage: text("error_message"),
});

export type JobLog = typeof jobLogs.$inferSelect;
export type InsertJobLog = typeof jobLogs.$inferInsert;

// Push Subscriptions table
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  endpoint: text("endpoint").notNull().unique(),
  keys: jsonb("keys").$type<{ p256dh: string; auth: string }>().notNull(),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Notification Preferences table - granular control
export const notificationPreferences = pgTable("notification_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  
  // Notification Types Enabled
  tidesEnabled: boolean("tides_enabled").default(true),
  sportsEnabled: boolean("sports_enabled").default(true),
  astronomyEnabled: boolean("astronomy_enabled").default(true),
  agricultureEnabled: boolean("agriculture_enabled").default(false),
  culturalEnabled: boolean("cultural_enabled").default(true),
  holidaysEnabled: boolean("holidays_enabled").default(true),
  
  // Frequency Settings (immediate, daily, weekly, never)
  tidesFrequency: text("tides_frequency").default("immediate"), 
  sportsFrequency: text("sports_frequency").default("daily"),
  astronomyFrequency: text("astronomy_frequency").default("daily"),
  agricultureFrequency: text("agriculture_frequency").default("weekly"),
  culturalFrequency: text("cultural_frequency").default("weekly"),
  holidaysFrequency: text("holidays_frequency").default("daily"),
  
  // Time preferences
  preferredNotificationTime: text("preferred_notification_time").default("09:00"),
  quietHoursStart: text("quiet_hours_start").default("22:00"),
  quietHoursEnd: text("quiet_hours_end").default("08:00"),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Relations for push subscriptions
export const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [pushSubscriptions.userId],
    references: [users.id],
  }),
}));

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(users, {
    fields: [notificationPreferences.userId],
    references: [users.id],
  }),
}));

// Zod schemas
export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationPreferencesSchema = createInsertSchema(notificationPreferences).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

// TypeScript types
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;
export type NotificationPreferences = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreferences = z.infer<typeof insertNotificationPreferencesSchema>;
