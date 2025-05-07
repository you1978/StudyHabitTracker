import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subMonths, addMonths } from "date-fns";
import { ja } from "date-fns/locale";
import Header from "@/components/header";
import MobileNav from "@/components/mobile-nav";
import HabitCalendar from "@/components/habit-calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';

export default function AnalyticsPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Fetch monthly calendar data based on currentMonth
  const {
    data: calendarData,
    isLoading: calendarLoading,
  } = useQuery({
    queryKey: ["/api/monthly-calendar", { 
      month: currentMonth.getMonth() + 1, 
      year: currentMonth.getFullYear() 
    }],
  });
  
  // Fetch habits data for statistics
  const {
    data: habitsData,
    isLoading: habitsLoading,
  } = useQuery({
    queryKey: ["/api/habits"],
  });

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  // Format month for display
  const formattedMonth = format(currentMonth, 'yyyy年MM月', { locale: ja });

  // Calculate monthly statistics from calendar data
  const getMonthlyStats = () => {
    if (!calendarData || !calendarData.days) return { completionRate: 0, totalDays: 0, completedDays: 0 };

    const days = Object.values(calendarData.days);
    const totalDays = days.length;
    const completedDays = days.filter((day: any) => day.completed > 0).length;
    const completionRate = totalDays > 0 ? (completedDays / totalDays) * 100 : 0;

    return {
      completionRate: Math.round(completionRate),
      totalDays,
      completedDays
    };
  };

  const stats = getMonthlyStats();

  // Prepare data for bar chart - completion by day of week
  const prepareDayOfWeekData = () => {
    if (!calendarData || !calendarData.days) return [];

    const dayOfWeekCounts = [
      { name: '日', completed: 0, total: 0 },
      { name: '月', completed: 0, total: 0 },
      { name: '火', completed: 0, total: 0 },
      { name: '水', completed: 0, total: 0 },
      { name: '木', completed: 0, total: 0 },
      { name: '金', completed: 0, total: 0 },
      { name: '土', completed: 0, total: 0 }
    ];

    Object.entries(calendarData.days).forEach(([dateStr, day]: [string, any]) => {
      const date = new Date(dateStr);
      const dayOfWeek = date.getDay(); // 0 for Sunday, 1 for Monday, etc.
      
      dayOfWeekCounts[dayOfWeek].total++;
      if (day.completed > 0) {
        dayOfWeekCounts[dayOfWeek].completed++;
      }
    });

    return dayOfWeekCounts.map(day => ({
      ...day,
      completionRate: day.total > 0 ? Math.round((day.completed / day.total) * 100) : 0
    }));
  };

  const dayOfWeekData = prepareDayOfWeekData();

  // Prepare data for pie chart - habit categories
  const prepareCategoryData = () => {
    if (!habitsData) return [];

    const categories: Record<string, number> = {};
    
    habitsData.forEach((habit: any) => {
      const category = habit.category || 'その他';
      categories[category] = (categories[category] || 0) + 1;
    });

    return Object.entries(categories).map(([name, value]) => ({
      name,
      value
    }));
  };

  const categoryData = prepareCategoryData();
  
  // Colors for pie chart
  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 pb-16 md:pb-0">
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold leading-7 text-gray-900 sm:text-2xl">
              習慣の分析
            </h2>
            <p className="mt-1 text-sm text-gray-500">あなたの習慣達成状況の統計情報を確認できます</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Monthly overview card */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>月間概要</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium">{formattedMonth}</span>
                  <Button variant="outline" size="icon" onClick={goToNextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {calendarLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <p className="text-sm text-blue-600 font-medium">完了率</p>
                      <p className="text-3xl font-bold text-blue-700">{stats.completionRate}%</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <p className="text-sm text-green-600 font-medium">完了した日数</p>
                      <p className="text-3xl font-bold text-green-700">{stats.completedDays}日</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-4 text-center">
                      <p className="text-sm text-amber-600 font-medium">総日数</p>
                      <p className="text-3xl font-bold text-amber-700">{stats.totalDays}日</p>
                    </div>
                  </div>
                  
                  <HabitCalendar calendar={calendarData} showMonthName={false} />
                </>
              )}
            </CardContent>
          </Card>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>曜日別達成率</CardTitle>
              </CardHeader>
              <CardContent>
                {calendarLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={dayOfWeekData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis label={{ value: '達成率 (%)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip formatter={(value) => [`${value}%`, '達成率']} />
                        <Bar dataKey="completionRate" fill="#4F46E5" name="達成率" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>習慣カテゴリ分布</CardTitle>
              </CardHeader>
              <CardContent>
                {habitsLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : categoryData.length > 0 ? (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-500">
                    表示するデータがありません
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <MobileNav activeTab="analytics" />
    </div>
  );
}
