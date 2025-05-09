import { users, type User, type InsertUser, habits, type Habit, type InsertHabit, habitRecords, type HabitRecord, type InsertHabitRecord, streaks, type Streak, type InsertStreak } from "@shared/schema";
import { db } from './db';
import { eq, and, gte, lte } from 'drizzle-orm';
import connectPg from "connect-pg-simple";
import session from "express-session";
import { Pool } from '@neondatabase/serverless';

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  
  // Habit management
  getHabit(id: number): Promise<Habit | undefined>;
  getHabitsByUserId(userId: number): Promise<Habit[]>;
  createHabit(habit: InsertHabit): Promise<Habit>;
  updateHabit(id: number, habitData: Partial<Habit>): Promise<Habit | undefined>;
  deleteHabit(id: number): Promise<boolean>;

  // Habit record management
  getHabitRecord(id: number): Promise<HabitRecord | undefined>;
  getHabitRecordByDate(habitId: number, date: Date): Promise<HabitRecord | undefined>;
  getHabitRecordsByUserId(userId: number, startDate?: Date, endDate?: Date): Promise<HabitRecord[]>;
  createHabitRecord(record: InsertHabitRecord): Promise<HabitRecord>;
  updateHabitRecord(id: number, recordData: Partial<HabitRecord>): Promise<HabitRecord | undefined>;

  // Streak management
  getStreak(habitId: number): Promise<Streak | undefined>;
  updateStreak(habitId: number, streakData: Partial<Streak>): Promise<Streak | undefined>;
  createStreak(streak: InsertStreak): Promise<Streak>;

  // Session store
  sessionStore: any; // express-sessionのStore型
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  sessionStore: any; // express-sessionのSessionStore型

  constructor() {
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({ 
      pool: new Pool({ connectionString: process.env.DATABASE_URL }), 
      createTableIfMissing: true 
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    console.log(`getUser - Looking for user with ID: ${id}`);
    
    if (!db) {
      console.error('getUser - データベース接続が存在しません');
      return undefined;
    }
    
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      console.log(`getUser - Result: ${user ? `Found user ${user.username}` : 'User not found'}`);
      return user || undefined;
    } catch (error) {
      console.error('getUser - エラーが発生しました:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!db) {
      console.error('getUserByUsername - データベース接続が存在しません');
      return undefined;
    }
    
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user || undefined;
    } catch (error) {
      console.error('getUserByUsername - エラーが発生しました:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Habit methods
  async getHabit(id: number): Promise<Habit | undefined> {
    const [habit] = await db.select().from(habits).where(eq(habits.id, id));
    return habit || undefined;
  }

  async getHabitsByUserId(userId: number): Promise<Habit[]> {
    console.log(`getHabitsByUserId - userId: ${userId}`);
    const result = await db.select().from(habits).where(eq(habits.userId, userId));
    console.log(`getHabitsByUserId - found ${result.length} habits for user ${userId}`);
    return result;
  }

  async createHabit(habit: InsertHabit): Promise<Habit> {
    const [newHabit] = await db.insert(habits).values(habit).returning();
    
    // Create initial streak entry
    await this.createStreak({
      habitId: newHabit.id,
      userId: habit.userId,
      currentStreak: 0,
      longestStreak: 0,
      lastCompletedDate: null
    });
    
    return newHabit;
  }

  async updateHabit(id: number, habitData: Partial<Habit>): Promise<Habit | undefined> {
    const [updatedHabit] = await db.update(habits)
      .set(habitData)
      .where(eq(habits.id, id))
      .returning();
    return updatedHabit;
  }

  async deleteHabit(id: number): Promise<boolean> {
    const [deletedHabit] = await db.delete(habits).where(eq(habits.id, id)).returning();
    return !!deletedHabit;
  }

  // Habit record methods
  async getHabitRecord(id: number): Promise<HabitRecord | undefined> {
    const [record] = await db.select().from(habitRecords).where(eq(habitRecords.id, id));
    return record || undefined;
  }

  async getHabitRecordByDate(habitId: number, date: Date): Promise<HabitRecord | undefined> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const [record] = await db.select().from(habitRecords).where(
      and(
        eq(habitRecords.habitId, habitId),
        gte(habitRecords.date, startOfDay),
        lte(habitRecords.date, endOfDay)
      )
    );
    
    return record || undefined;
  }

  async getHabitRecordsByUserId(userId: number, startDate?: Date, endDate?: Date): Promise<HabitRecord[]> {
    // 基本クエリを作成（ユーザーIDでフィルタリング）
    let conditions = [eq(habitRecords.userId, userId)];
    
    // 開始日が指定されている場合は条件に追加
    if (startDate) {
      conditions.push(gte(habitRecords.date, startDate));
    }
    
    // 終了日が指定されている場合は条件に追加
    if (endDate) {
      conditions.push(lte(habitRecords.date, endDate));
    }
    
    // すべての条件を AND で結合して実行
    return db.select()
      .from(habitRecords)
      .where(and(...conditions));
  }

  async createHabitRecord(record: InsertHabitRecord): Promise<HabitRecord> {
    const [newRecord] = await db.insert(habitRecords).values(record).returning();
    
    // Update streak if completed
    if (record.completed) {
      await this.updateStreakForCompletedHabit(record.habitId, record.date);
    }
    
    return newRecord;
  }

  async updateHabitRecord(id: number, recordData: Partial<HabitRecord>): Promise<HabitRecord | undefined> {
    const record = await this.getHabitRecord(id);
    if (!record) return undefined;

    const [updatedRecord] = await db.update(habitRecords)
      .set(recordData)
      .where(eq(habitRecords.id, id))
      .returning();
    
    // Recalculate streak if completed status changed
    if (record.completed !== updatedRecord.completed) {
      await this.recalculateStreak(updatedRecord.habitId);
    }
    
    return updatedRecord;
  }

  // Streak methods
  async getStreak(habitId: number, userId?: number): Promise<Streak | undefined> {
    // If userId is not provided, get the userId from the habit
    if (!userId) {
      const habit = await this.getHabit(habitId);
      if (!habit) return undefined;
      userId = habit.userId;
    }
    
    console.log(`getStreak - habitId: ${habitId}, userId: ${userId}`);
    
    // Always filter by both habitId and userId to ensure data isolation
    const [streak] = await db.select().from(streaks).where(
      and(
        eq(streaks.habitId, habitId),
        eq(streaks.userId, userId)
      )
    );
    return streak || undefined;
  }

  async createStreak(streak: InsertStreak): Promise<Streak> {
    const [newStreak] = await db.insert(streaks).values(streak).returning();
    return newStreak;
  }

  async updateStreak(habitId: number, streakData: Partial<Streak>): Promise<Streak | undefined> {
    // 習慣を取得してユーザーIDを特定
    const habit = await this.getHabit(habitId);
    if (!habit) return undefined;

    // habitIdとuserIdの両方でフィルタリングして更新
    const [updatedStreak] = await db.update(streaks)
      .set(streakData)
      .where(and(
        eq(streaks.habitId, habitId),
        eq(streaks.userId, habit.userId)
      ))
      .returning();
    return updatedStreak;
  }

  // Helper methods
  private async updateStreakForCompletedHabit(habitId: number, date: Date): Promise<void> {
    // habitIdに対応するhabitを取得して、そのuserIdを使用
    const habit = await this.getHabit(habitId);
    if (!habit) return;
    
    const streak = await this.getStreak(habitId, habit.userId);
    if (!streak) return;

    const lastDate = streak.lastCompletedDate;
    const today = new Date(date);
    today.setHours(0, 0, 0, 0);
    
    let currentStreak = streak.currentStreak;
    
    if (!lastDate) {
      // First completion
      currentStreak = 1;
    } else {
      const lastDay = new Date(lastDate);
      lastDay.setHours(0, 0, 0, 0);
      
      const diffTime = today.getTime() - lastDay.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        // Same day, no streak change
      } else if (diffDays === 1) {
        // Consecutive day
        currentStreak += 1;
      } else {
        // Streak broken
        currentStreak = 1;
      }
    }
    
    const longestStreak = Math.max(currentStreak, streak.longestStreak);
    
    await this.updateStreak(habitId, {
      currentStreak,
      longestStreak,
      lastCompletedDate: date
    });
  }

  private async recalculateStreak(habitId: number): Promise<void> {
    const habit = await this.getHabit(habitId);
    if (!habit) return;
    
    // Get all completed records for this habit（習慣の所有者のユーザーIDでもフィルタリング）
    const records = await db.select()
      .from(habitRecords)
      .where(and(
        eq(habitRecords.habitId, habitId),
        eq(habitRecords.userId, habit.userId), // habitの所有者のユーザーIDでもフィルタリング
        eq(habitRecords.completed, true)
      ))
      .orderBy(habitRecords.date);
    
    if (records.length === 0) {
      // No completed records, reset streak
      await this.updateStreak(habitId, {
        currentStreak: 0,
        lastCompletedDate: null
      });
      return;
    }
    
    // Calculate current streak
    let currentStreak = 1;
    let maxStreak = 1;
    let lastDate = new Date(records[0].date);
    lastDate.setHours(0, 0, 0, 0);
    
    for (let i = 1; i < records.length; i++) {
      const currentDate = new Date(records[i].date);
      currentDate.setHours(0, 0, 0, 0);
      
      const diffTime = currentDate.getTime() - lastDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        // Consecutive day
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else if (diffDays > 1) {
        // Streak broken
        currentStreak = 1;
      }
      
      lastDate = currentDate;
    }
    
    // Update streak
    await this.updateStreak(habitId, {
      currentStreak,
      longestStreak: maxStreak,
      lastCompletedDate: records[records.length - 1].date
    });
  }
}

export const storage = new DatabaseStorage();