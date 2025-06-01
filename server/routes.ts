import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertHabitSchema, insertHabitRecordSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { startOfDay, endOfDay, startOfMonth, endOfMonth, format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { setupCors } from '../cors-middleware';

// Helper function to check if user is authenticated
function ensureAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "認証が必要です" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // CORS設定（本番環境用）
  setupCors(app, {
    origin: (origin, callback) => {
      // 本番環境では環境変数でホワイトリストを管理
      const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
        process.env.ALLOWED_ORIGINS.split(',') : 
        ['http://localhost:3000', 'http://localhost:5000'];
      
      // originがundefinedの場合（同一オリジン）は許可
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // Cookieを含むリクエストを許可
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Set up authentication routes (/api/register, /api/login, /api/logout, /api/user)
  setupAuth(app);

  // Habits endpoints
  app.get("/api/habits", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      console.log("GET /api/habits - User ID:", userId);
      const habits = await storage.getHabitsByUserId(userId);
      
      // Get streaks for each habit
      const habitsWithStreaks = await Promise.all(habits.map(async (habit) => {
        const streak = await storage.getStreak(habit.id, userId);
        return {
          ...habit,
          streak: streak || { currentStreak: 0, longestStreak: 0 }
        };
      }));
      
      res.json(habitsWithStreaks);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "エラーが発生しました" });
    }
  });

  app.post("/api/habits", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const habitData = { ...req.body, userId };
      
      const validatedData = insertHabitSchema.parse(habitData);
      const habit = await storage.createHabit(validatedData);
      
      res.status(201).json(habit);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error(error);
      res.status(500).json({ message: "エラーが発生しました" });
    }
  });

  app.put("/api/habits/:id", ensureAuthenticated, async (req, res) => {
    try {
      const habitId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Verify ownership
      const habit = await storage.getHabit(habitId);
      if (!habit) {
        return res.status(404).json({ message: "習慣が見つかりません" });
      }
      
      if (habit.userId !== userId) {
        return res.status(403).json({ message: "このアクションは許可されていません" });
      }
      
      const updatedHabit = await storage.updateHabit(habitId, req.body);
      res.json(updatedHabit);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "エラーが発生しました" });
    }
  });

  app.delete("/api/habits/:id", ensureAuthenticated, async (req, res) => {
    try {
      const habitId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Verify ownership
      const habit = await storage.getHabit(habitId);
      if (!habit) {
        return res.status(404).json({ message: "習慣が見つかりません" });
      }
      
      if (habit.userId !== userId) {
        return res.status(403).json({ message: "このアクションは許可されていません" });
      }
      
      await storage.deleteHabit(habitId);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "エラーが発生しました" });
    }
  });

  // Habit Records endpoints
  app.get("/api/records", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { startDate, endDate } = req.query;
      
      let start: Date | undefined;
      let end: Date | undefined;
      
      if (startDate) {
        start = parseISO(startDate as string);
      }
      
      if (endDate) {
        end = parseISO(endDate as string);
      }
      
      const records = await storage.getHabitRecordsByUserId(userId, start, end);
      res.json(records);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "エラーが発生しました" });
    }
  });

  app.post("/api/records", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // 日付文字列があれば Date オブジェクトに変換
      const recordData = { 
        ...req.body, 
        userId,
        date: req.body.date ? new Date(req.body.date) : undefined
      };
      
      console.log("Received record data:", JSON.stringify({
        ...recordData,
        date: recordData.date ? recordData.date.toISOString() : undefined
      }));
      
      // Validate the record data
      const validatedData = insertHabitRecordSchema.parse(recordData);
      console.log("Validated data:", JSON.stringify({
        ...validatedData,
        date: validatedData.date.toISOString()
      }));
      
      // Check if habit belongs to user
      const habit = await storage.getHabit(validatedData.habitId);
      if (!habit || habit.userId !== userId) {
        return res.status(403).json({ message: "このアクションは許可されていません" });
      }
      
      // Check if a record already exists for this date and habit
      const existingRecord = await storage.getHabitRecordByDate(
        validatedData.habitId,
        validatedData.date
      );
      
      if (existingRecord) {
        // Update existing record
        const updatedRecord = await storage.updateHabitRecord(
          existingRecord.id,
          validatedData
        );
        return res.json(updatedRecord);
      }
      
      // Create new record
      const record = await storage.createHabitRecord(validatedData);
      res.status(201).json(record);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error(error);
      res.status(500).json({ message: "エラーが発生しました" });
    }
  });

  app.put("/api/records/:id", ensureAuthenticated, async (req, res) => {
    try {
      const recordId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Verify ownership
      const record = await storage.getHabitRecord(recordId);
      if (!record) {
        return res.status(404).json({ message: "記録が見つかりません" });
      }
      
      if (record.userId !== userId) {
        return res.status(403).json({ message: "このアクションは許可されていません" });
      }
      
      const updatedRecord = await storage.updateHabitRecord(recordId, req.body);
      res.json(updatedRecord);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "エラーが発生しました" });
    }
  });

  // Today's records summary
  app.get("/api/today", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      console.log("GET /api/today - User ID:", userId);
      const today = new Date();
      const todayStart = startOfDay(today);
      const todayEnd = endOfDay(today);
      
      // Get all habits for the user
      const habits = await storage.getHabitsByUserId(userId);
      
      // Get records for today
      const records = await storage.getHabitRecordsByUserId(
        userId, 
        todayStart, 
        todayEnd
      );
      
      // Create a summary
      const completedCount = records.filter(r => r.completed).length;
      const totalCount = habits.length;
      
      // Format today's date in Japanese
      const todayFormatted = format(today, 'yyyy年MM月dd日（eee）', { locale: ja });
      
      // Get today's progress with habits and their completion status
      const habitProgress = await Promise.all(habits.map(async habit => {
        const record = records.find(r => r.habitId === habit.id);
        const streak = await storage.getStreak(habit.id, userId);
        
        return {
          habit,
          record,
          streak
        };
      }));
      
      res.json({
        date: todayFormatted,
        completed: completedCount,
        total: totalCount,
        progress: (totalCount > 0) ? (completedCount / totalCount) : 0,
        habits: habitProgress
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "エラーが発生しました" });
    }
  });

  // Weekly progress
  app.get("/api/weekly-progress", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      console.log("GET /api/weekly-progress - User ID:", userId);
      const today = new Date();
      
      // Calculate start of week (last 7 days)
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      
      // Get all habits
      const habits = await storage.getHabitsByUserId(userId);
      
      // Get records for the week
      const records = await storage.getHabitRecordsByUserId(userId, startDate, today);
      
      // Create an array for each day of the week
      const days = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);
        
        // Filter records for this day
        const dayRecords = records.filter(
          r => r.date >= dayStart && r.date <= dayEnd
        );
        
        const completed = dayRecords.filter(r => r.completed).length;
        const dayName = format(date, 'eee', { locale: ja });
        
        days.push({
          date: format(date, 'yyyy-MM-dd'),
          dayName,
          completed,
          total: habits.length,
          progress: (habits.length > 0) ? (completed / habits.length) : 0,
          isToday: format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
        });
      }
      
      res.json(days);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "エラーが発生しました" });
    }
  });

  // Monthly calendar data
  app.get("/api/monthly-calendar", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      console.log("GET /api/monthly-calendar - User ID:", userId);
      const { month, year } = req.query;
      
      let targetDate: Date;
      
      if (month && year) {
        targetDate = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);
      } else {
        targetDate = new Date();
      }
      
      const monthStart = startOfMonth(targetDate);
      const monthEnd = endOfMonth(targetDate);
      
      // Get all habits
      const habits = await storage.getHabitsByUserId(userId);
      
      // Get records for the month
      const records = await storage.getHabitRecordsByUserId(userId, monthStart, monthEnd);
      
      // Group records by date
      const calendarData: Record<string, { completed: number; total: number }> = {};
      
      // Initialize all dates in the month
      let currentDate = new Date(monthStart);
      while (currentDate <= monthEnd) {
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        calendarData[dateStr] = { completed: 0, total: habits.length };
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // Count completed habits for each day
      records.forEach(record => {
        if (record.completed) {
          const dateStr = format(record.date, 'yyyy-MM-dd');
          if (calendarData[dateStr]) {
            calendarData[dateStr].completed += 1;
          }
        }
      });
      
      // Get formatted month name
      const monthName = format(targetDate, 'yyyy年MM月', { locale: ja });
      
      res.json({
        month: monthName,
        days: calendarData
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "エラーが発生しました" });
    }
  });

  // Update profile
  app.put("/api/profile", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { nickname, goalField } = req.body;
      
      const updatedUser = await storage.updateUser(userId, {
        nickname,
        goalField
      });
      
      res.json(updatedUser);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "エラーが発生しました" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
