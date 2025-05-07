import { users, type User, type InsertUser, habits, type Habit, type InsertHabit, habitRecords, type HabitRecord, type InsertHabitRecord, streaks, type Streak, type InsertStreak } from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";

// Create memory store for sessions
const MemoryStore = createMemoryStore(session);

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
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private habits: Map<number, Habit>;
  private habitRecords: Map<number, HabitRecord>;
  private streakMap: Map<number, Streak>;
  private userCurrentId: number;
  private habitCurrentId: number;
  private recordCurrentId: number;
  private streakCurrentId: number;
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.habits = new Map();
    this.habitRecords = new Map();
    this.streakMap = new Map();
    this.userCurrentId = 1;
    this.habitCurrentId = 1;
    this.recordCurrentId = 1;
    this.streakCurrentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Habit methods
  async getHabit(id: number): Promise<Habit | undefined> {
    return this.habits.get(id);
  }

  async getHabitsByUserId(userId: number): Promise<Habit[]> {
    return Array.from(this.habits.values()).filter(
      (habit) => habit.userId === userId,
    );
  }

  async createHabit(habit: InsertHabit): Promise<Habit> {
    const id = this.habitCurrentId++;
    const newHabit: Habit = { 
      ...habit, 
      id, 
      createdAt: new Date() 
    };
    this.habits.set(id, newHabit);
    
    // Create initial streak entry
    await this.createStreak({
      habitId: id,
      userId: habit.userId,
      currentStreak: 0,
      longestStreak: 0,
      lastCompletedDate: null
    });
    
    return newHabit;
  }

  async updateHabit(id: number, habitData: Partial<Habit>): Promise<Habit | undefined> {
    const habit = await this.getHabit(id);
    if (!habit) return undefined;

    const updatedHabit = { ...habit, ...habitData };
    this.habits.set(id, updatedHabit);
    return updatedHabit;
  }

  async deleteHabit(id: number): Promise<boolean> {
    return this.habits.delete(id);
  }

  // Habit record methods
  async getHabitRecord(id: number): Promise<HabitRecord | undefined> {
    return this.habitRecords.get(id);
  }

  async getHabitRecordByDate(habitId: number, date: Date): Promise<HabitRecord | undefined> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return Array.from(this.habitRecords.values()).find(
      (record) => 
        record.habitId === habitId && 
        record.date >= startOfDay && 
        record.date <= endOfDay
    );
  }

  async getHabitRecordsByUserId(
    userId: number, 
    startDate?: Date, 
    endDate?: Date
  ): Promise<HabitRecord[]> {
    return Array.from(this.habitRecords.values()).filter(
      (record) => {
        if (record.userId !== userId) return false;
        
        if (startDate && record.date < startDate) return false;
        if (endDate && record.date > endDate) return false;
        
        return true;
      }
    );
  }

  async createHabitRecord(record: InsertHabitRecord): Promise<HabitRecord> {
    const id = this.recordCurrentId++;
    const newRecord: HabitRecord = { ...record, id };
    this.habitRecords.set(id, newRecord);
    
    // Update streak if completed
    if (record.completed) {
      await this.updateStreakForCompletedHabit(record.habitId, record.date);
    }
    
    return newRecord;
  }

  async updateHabitRecord(id: number, recordData: Partial<HabitRecord>): Promise<HabitRecord | undefined> {
    const record = await this.getHabitRecord(id);
    if (!record) return undefined;

    const updatedRecord = { ...record, ...recordData };
    this.habitRecords.set(id, updatedRecord);
    
    // Update streak if completion status changed
    if (record.completed !== updatedRecord.completed) {
      if (updatedRecord.completed) {
        await this.updateStreakForCompletedHabit(record.habitId, record.date);
      } else {
        // Recalculate streak if habit was marked as not completed
        await this.recalculateStreak(record.habitId);
      }
    }
    
    return updatedRecord;
  }

  // Streak methods
  async getStreak(habitId: number): Promise<Streak | undefined> {
    return Array.from(this.streakMap.values()).find(
      (streak) => streak.habitId === habitId
    );
  }

  async createStreak(streak: InsertStreak): Promise<Streak> {
    const id = this.streakCurrentId++;
    const newStreak: Streak = { ...streak, id };
    this.streakMap.set(id, newStreak);
    return newStreak;
  }

  async updateStreak(habitId: number, streakData: Partial<Streak>): Promise<Streak | undefined> {
    const streak = await this.getStreak(habitId);
    if (!streak) return undefined;

    const updatedStreak = { ...streak, ...streakData };
    this.streakMap.set(streak.id, updatedStreak);
    return updatedStreak;
  }

  // Helper methods
  private async updateStreakForCompletedHabit(habitId: number, date: Date): Promise<void> {
    const streak = await this.getStreak(habitId);
    if (!streak) return;

    const lastDate = streak.lastCompletedDate;
    const today = new Date(date);
    today.setHours(0, 0, 0, 0);
    
    let currentStreak = streak.currentStreak;
    
    if (!lastDate) {
      // First completion
      currentStreak = 1;
    } else {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const lastCompletedDay = new Date(lastDate);
      lastCompletedDay.setHours(0, 0, 0, 0);
      
      if (lastCompletedDay.getTime() === yesterday.getTime()) {
        // Consecutive day
        currentStreak += 1;
      } else if (lastCompletedDay.getTime() === today.getTime()) {
        // Same day, streak doesn't change
      } else {
        // Streak broken
        currentStreak = 1;
      }
    }
    
    await this.updateStreak(habitId, {
      currentStreak,
      longestStreak: Math.max(currentStreak, streak.longestStreak),
      lastCompletedDate: today
    });
  }

  private async recalculateStreak(habitId: number): Promise<void> {
    const habit = await this.getHabit(habitId);
    if (!habit) return;
    
    // Get all completed records for this habit, sorted by date
    const records = Array.from(this.habitRecords.values())
      .filter(record => record.habitId === habitId && record.completed)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    
    let currentStreak = 0;
    let longestStreak = 0;
    let lastCompletedDate = null;
    
    if (records.length > 0) {
      // Calculate streaks
      currentStreak = 1;
      lastCompletedDate = new Date(records[records.length - 1].date);
      
      for (let i = 1; i < records.length; i++) {
        const prevDate = new Date(records[i-1].date);
        prevDate.setHours(0, 0, 0, 0);
        
        const currDate = new Date(records[i].date);
        currDate.setHours(0, 0, 0, 0);
        
        const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          // Consecutive day
          currentStreak++;
        } else if (diffDays > 1) {
          // Streak broken
          longestStreak = Math.max(longestStreak, currentStreak);
          currentStreak = 1;
        }
      }
      
      longestStreak = Math.max(longestStreak, currentStreak);
    }
    
    await this.updateStreak(habitId, {
      currentStreak,
      longestStreak,
      lastCompletedDate
    });
  }
}

export const storage = new MemStorage();
