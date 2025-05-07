import { useMemo } from "react";
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  format,
  isSameMonth,
  isToday
} from 'date-fns';
import { ja } from 'date-fns/locale';

interface HabitCalendarProps {
  calendar: any;
  showMonthName?: boolean;
}

export default function HabitCalendar({ 
  calendar, 
  showMonthName = true 
}: HabitCalendarProps) {
  // Generate calendar days
  const calendarDays = useMemo(() => {
    // Default to current month if no data
    const now = new Date();
    const monthDate = calendar?.month ? 
      new Date(calendar.month.replace(/年|月/g, '-').slice(0, -1)) : 
      now;
    
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart, { locale: ja });
    const calendarEnd = endOfWeek(monthEnd, { locale: ja });
    
    return eachDayOfInterval({
      start: calendarStart,
      end: calendarEnd
    });
  }, [calendar]);

  // Get week day names in Japanese
  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

  // Format date string for lookup in calendar data
  const formatDateKey = (date: Date) => {
    return format(date, 'yyyy-MM-dd');
  };

  // Get calendar data for a specific date
  const getDateData = (date: Date) => {
    if (!calendar || !calendar.days) return { completed: 0, total: 0 };
    
    const dateKey = formatDateKey(date);
    return calendar.days[dateKey] || { completed: 0, total: 0 };
  };

  // Determine the class for a calendar day
  const getDayClass = (date: Date) => {
    const isSameMonthDay = isSameMonth(date, new Date()); 
    const isCurrentDay = isToday(date);
    const dateData = getDateData(date);
    
    let className = "p-1 text-xs ";
    
    // Not current month, make faded
    if (!isSameMonthDay) {
      className += "text-gray-300 ";
    }
    
    // Today, show special border
    if (isCurrentDay) {
      className += "border-2 border-primary rounded font-medium ";
    }
    
    // Has completion data
    if (dateData.completed > 0) {
      const ratio = dateData.completed / Math.max(1, dateData.total);
      if (ratio >= 1) {
        className += "bg-green-50 "; // Fully completed
      } else if (ratio > 0) {
        className += "bg-amber-50 "; // Partially completed
      }
    }
    
    return className;
  };

  if (!calendar) {
    return (
      <div className="text-center py-6 text-gray-400">
        カレンダーデータがありません
      </div>
    );
  }

  return (
    <div>
      {showMonthName && calendar.month && (
        <h4 className="text-base font-medium text-gray-900 mb-3">{calendar.month}</h4>
      )}
      
      <div className="grid grid-cols-7 gap-1 text-center">
        {/* Weekday headers */}
        {weekDays.map((day, index) => (
          <div key={index} className="text-xs font-medium text-gray-500">{day}</div>
        ))}
        
        {/* Calendar days */}
        {calendarDays.map((day, i) => {
          const dateData = getDateData(day);
          return (
            <div key={i} className={getDayClass(day)}>
              {format(day, 'd')}
              {dateData.completed > 0 && (
                <div className="mt-1 mx-auto w-2 h-2 rounded-full bg-secondary"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
