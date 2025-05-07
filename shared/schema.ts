import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  nickname: text("nickname"),
  goalField: text("goal_field"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  nickname: true,
  goalField: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Habits schema
export const habits = pgTable("habits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  goalValue: integer("goal_value"),
  goalUnit: text("goal_unit"),
  category: text("category"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertHabitSchema = createInsertSchema(habits).omit({
  id: true,
  createdAt: true,
});

export type InsertHabit = z.infer<typeof insertHabitSchema>;
export type Habit = typeof habits.$inferSelect;

// Habit records schema - tracks daily check-ins
export const habitRecords = pgTable("habit_records", {
  id: serial("id").primaryKey(),
  habitId: integer("habit_id").notNull(),
  userId: integer("user_id").notNull(),
  date: timestamp("date").notNull(),
  completed: boolean("completed").notNull().default(false),
  notes: text("notes"),
});

export const insertHabitRecordSchema = createInsertSchema(habitRecords).omit({
  id: true,
});

export type InsertHabitRecord = z.infer<typeof insertHabitRecordSchema>;
export type HabitRecord = typeof habitRecords.$inferSelect;

// Streak schema - tracks habit streaks
export const streaks = pgTable("streaks", {
  id: serial("id").primaryKey(),
  habitId: integer("habit_id").notNull(),
  userId: integer("user_id").notNull(),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastCompletedDate: timestamp("last_completed_date"),
});

export const insertStreakSchema = createInsertSchema(streaks).omit({
  id: true,
});

export type InsertStreak = z.infer<typeof insertStreakSchema>;
export type Streak = typeof streaks.$inferSelect;
