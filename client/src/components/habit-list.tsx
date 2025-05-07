import { useState } from "react";
import HabitItem from "./habit-item";
import { useQuery } from "@tanstack/react-query";

interface HabitListProps {
  habits: any[];
  onUpdate: () => void;
}

export default function HabitList({ habits, onUpdate }: HabitListProps) {
  if (!habits || habits.length === 0) {
    return (
      <div className="mt-4 bg-white shadow rounded-lg p-6 text-center">
        <p className="text-gray-500">まだ習慣が登録されていません。「習慣を追加」から新しい習慣を作成しましょう。</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      {habits.map((habitItem) => (
        <HabitItem 
          key={habitItem.habit.id} 
          habit={habitItem.habit} 
          record={habitItem.record} 
          streak={habitItem.streak}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  );
}
