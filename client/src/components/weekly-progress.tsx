import { useMemo } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

interface WeeklyProgressDay {
  date: string;
  dayName: string;
  completed: number;
  total: number;
  progress: number;
  isToday: boolean;
}

interface WeeklyProgressProps {
  days: WeeklyProgressDay[];
}

export default function WeeklyProgress({ days }: WeeklyProgressProps) {
  // If no data provided, show empty state
  if (!days || days.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        表示するデータがありません
      </div>
    );
  }

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((day, index) => (
        <div key={index} className="flex flex-col items-center">
          <span className="text-xs text-gray-500">{day.dayName}</span>
          {day.isToday ? (
            <div className="mt-1 w-8 h-8 rounded-full flex items-center justify-center bg-neutral-100 text-gray-500 border-2 border-dashed border-gray-300">
              <span className="text-xs">今日</span>
            </div>
          ) : day.completed > 0 ? (
            <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center ${day.completed === day.total ? 'bg-secondary text-white' : 'bg-amber-400 text-white'}`}>
              {day.completed === day.total ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <span className="text-xs font-medium">{day.completed}/{day.total}</span>
              )}
            </div>
          ) : (
            <div className="mt-1 w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          )}
          <span className="mt-1 text-xs text-gray-500">
            {format(new Date(day.date), 'MM/dd', { locale: ja })}
          </span>
        </div>
      ))}
    </div>
  );
}
