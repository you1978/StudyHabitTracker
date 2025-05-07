import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/header";
import MobileNav from "@/components/mobile-nav";
import ProgressSummary from "@/components/progress-summary";
import HabitList from "@/components/habit-list";
import WeeklyProgress from "@/components/weekly-progress";
import HabitCalendar from "@/components/habit-calendar";
import AddHabitDialog from "@/components/add-habit-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const [showAddHabitDialog, setShowAddHabitDialog] = useState(false);
  
  // Fetch today's data
  const {
    data: todayData,
    isLoading: todayLoading,
    refetch: refetchToday
  } = useQuery({
    queryKey: ["/api/today"],
  });

  // Fetch weekly progress data
  const {
    data: weeklyData,
    isLoading: weeklyLoading,
    refetch: refetchWeekly
  } = useQuery({
    queryKey: ["/api/weekly-progress"],
  });

  // Fetch monthly calendar data
  const {
    data: calendarData,
    isLoading: calendarLoading,
    refetch: refetchCalendar
  } = useQuery({
    queryKey: ["/api/monthly-calendar"],
  });

  // Refetch all data after a habit is added/updated
  const refetchAllData = () => {
    refetchToday();
    refetchWeekly();
    refetchCalendar();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      {/* Main content */}
      <main className="flex-1 pb-16 md:pb-0">
        {/* Date Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold leading-7 text-gray-900 sm:text-2xl sm:truncate">
                  {todayLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary inline mr-2" />
                  ) : (
                    todayData?.date || format(new Date(), 'yyyy年MM月dd日（eee）', { locale: ja })
                  )}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  おはようございます、{user?.nickname || user?.username}さん！今日も頑張りましょう！
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Today's Progress Section */}
          <div className="px-4 sm:px-0 mb-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">今日の進捗</h3>
            {todayLoading ? (
              <Card className="mt-2">
                <CardContent className="pt-6 flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </CardContent>
              </Card>
            ) : (
              <ProgressSummary
                completed={todayData?.completed || 0}
                total={todayData?.total || 0}
              />
            )}
          </div>

          {/* Habits List */}
          <div className="px-4 sm:px-0">
            <div className="sm:flex sm:items-center">
              <div className="sm:flex-auto">
                <h3 className="text-lg font-medium leading-6 text-gray-900">習慣リスト</h3>
              </div>
              <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                <Button 
                  onClick={() => setShowAddHabitDialog(true)}
                  className="inline-flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  習慣を追加
                </Button>
              </div>
            </div>

            {todayLoading ? (
              <Card className="mt-4">
                <CardContent className="pt-6 flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </CardContent>
              </Card>
            ) : (
              <HabitList 
                habits={todayData?.habits || []} 
                onUpdate={refetchAllData}
              />
            )}
          </div>

          {/* Analysis Preview */}
          <div className="px-4 sm:px-0 mt-8">
            <div className="sm:flex sm:items-center">
              <div className="sm:flex-auto">
                <h3 className="text-lg font-medium leading-6 text-gray-900">習慣の分析</h3>
                <p className="mt-1 text-sm text-gray-500">過去の習慣達成状況を確認できます</p>
              </div>
              <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                <Button variant="outline" asChild>
                  <a href="/analytics">詳細を見る</a>
                </Button>
              </div>
            </div>

            <Card className="mt-4">
              <CardContent className="p-5">
                <h4 className="text-base font-medium text-gray-900 mb-4">今週の達成率</h4>
                {weeklyLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <WeeklyProgress days={weeklyData || []} />
                )}

                <div className="mt-6">
                  <h4 className="text-base font-medium text-gray-900 mb-3">カレンダービュー</h4>
                  {calendarLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <HabitCalendar calendar={calendarData} />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <MobileNav />

      <AddHabitDialog 
        open={showAddHabitDialog} 
        onOpenChange={setShowAddHabitDialog} 
        onSubmitSuccess={refetchAllData}
      />
    </div>
  );
}
