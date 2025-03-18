import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Gmail account schema
export const gmailAccounts = pgTable("gmail_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  email: text("email").notNull(),
  name: text("name"),
  authType: text("auth_type").notNull(), // 'oauth' or 'password'
  credentials: json("credentials").notNull(), // Encrypted credentials
  status: text("status").notNull().default("pending"), // 'active', 'error', 'pending', 'warning'
  lastCheck: timestamp("last_check"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGmailAccountSchema = createInsertSchema(gmailAccounts).omit({
  id: true,
  userId: true,
  lastCheck: true,
  createdAt: true,
});

// Scheduled tasks schema
export const scheduledTasks = pgTable("scheduled_tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  accountId: integer("account_id"), // Null if applied to all accounts
  taskType: text("task_type").notNull(), // 'sendEmail', 'checkInbox', 'verifyStatus', 'cleanUp'
  scheduleType: text("schedule_type").notNull(), // 'once', 'daily', 'weekly', 'monthly'
  scheduleConfig: json("schedule_config").notNull(), // Date, time, days, recurrence info
  lastRun: timestamp("last_run"),
  nextRun: timestamp("next_run"),
  status: text("status").notNull().default("pending"), // 'pending', 'completed', 'error', 'running'
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertScheduledTaskSchema = createInsertSchema(scheduledTasks).omit({
  id: true,
  userId: true,
  lastRun: true,
  status: true,
  createdAt: true,
});

// Activity log schema
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  accountId: integer("account_id"),
  type: text("type").notNull(), // 'verification', 'email_sent', 'auth_failed', 'account_added', etc.
  status: text("status").notNull(), // 'success', 'error', 'warning'
  message: text("message"),
  details: json("details"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type GmailAccount = typeof gmailAccounts.$inferSelect;
export type InsertGmailAccount = z.infer<typeof insertGmailAccountSchema>;

export type ScheduledTask = typeof scheduledTasks.$inferSelect;
export type InsertScheduledTask = z.infer<typeof insertScheduledTaskSchema>;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
