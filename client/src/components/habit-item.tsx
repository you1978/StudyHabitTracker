import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MoreVertical, Pencil, Trash2, StickyNote } from "lucide-react";

interface HabitItemProps {
  habit: any;
  record: any;
  streak: any;
  onUpdate: () => void;
}

export default function HabitItem({ habit, record, streak, onUpdate }: HabitItemProps) {
  const [isCompleted, setIsCompleted] = useState(record?.completed || false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteText, setNoteText] = useState(record?.notes || "");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const noteInputRef = useRef<HTMLTextAreaElement>(null);

  // Toggle habit completion status
  const toggleCompletionMutation = useMutation({
    mutationFn: async (completed: boolean) => {
      const today = new Date();
      // ISO形式文字列に変換して送信
      const isoDate = today.toISOString();
      
      const payload = {
        habitId: habit.id,
        date: isoDate,
        completed,
        notes: record?.notes || ""
      };

      await apiRequest(
        "POST",
        "/api/records",
        payload
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/weekly-progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/monthly-calendar"] });
      onUpdate();
      toast({
        title: !isCompleted ? "習慣を未完了にしました" : "習慣を完了しました",
        description: !isCompleted 
          ? "今日の記録を取り消しました" 
          : (streak && streak.currentStreak !== undefined) ? `連続記録: ${streak.currentStreak + 1}日!` : "記録を追加しました",
      });
    },
    onError: (error) => {
      setIsCompleted(!isCompleted); // Revert UI state
      toast({
        title: "エラーが発生しました",
        description: error instanceof Error ? error.message : "習慣の更新に失敗しました",
        variant: "destructive",
      });
    }
  });

  // Save note for habit
  const saveNoteMutation = useMutation({
    mutationFn: async (notes: string) => {
      const today = new Date();
      // ISO形式文字列に変換して送信
      const isoDate = today.toISOString();
      
      const payload = {
        habitId: habit.id,
        date: isoDate,
        completed: isCompleted,
        notes
      };

      await apiRequest(
        "POST",
        "/api/records",
        payload
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/today"] });
      setNoteDialogOpen(false);
      onUpdate();
      toast({
        title: "メモを保存しました",
        description: "習慣の記録にメモを追加しました",
      });
    },
    onError: (error) => {
      toast({
        title: "エラーが発生しました",
        description: error instanceof Error ? error.message : "メモの保存に失敗しました",
        variant: "destructive",
      });
    }
  });

  // Delete habit
  const deleteHabitMutation = useMutation({
    mutationFn: async () => {
      await apiRequest(
        "DELETE",
        `/api/habits/${habit.id}`,
        undefined
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/today"] });
      setDeleteDialogOpen(false);
      onUpdate();
      toast({
        title: "習慣を削除しました",
        description: "習慣が正常に削除されました",
      });
    },
    onError: (error) => {
      toast({
        title: "エラーが発生しました",
        description: error instanceof Error ? error.message : "習慣の削除に失敗しました",
        variant: "destructive",
      });
    }
  });

  const handleToggleCompletion = () => {
    const newState = !isCompleted;
    setIsCompleted(newState);
    toggleCompletionMutation.mutate(newState);
  };

  const handleOpenNoteDialog = () => {
    setNoteDialogOpen(true);
  };

  const handleSaveNote = () => {
    saveNoteMutation.mutate(noteText);
  };

  const handleDeleteHabit = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDeleteHabit = () => {
    deleteHabitMutation.mutate();
  };

  // Format category based on goalField
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'language': return '語学';
      case 'programming': return 'プログラミング';
      case 'qualification': return '資格';
      case 'business': return 'ビジネススキル';
      case 'other': return 'その他';
      default: return category;
    }
  };

  // Format goal text based on unit
  const getGoalText = () => {
    if (!habit.goalValue) return '';
    
    return `目標: ${habit.goalValue}${habit.goalUnit || '個'}/日`;
  };

  return (
    <>
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-lg font-medium text-gray-900">{habit.name}</h4>
              <p className="mt-1 text-sm text-gray-500">{habit.description}</p>
              
              <div className="mt-2 flex items-center space-x-2">
                {streak && streak.currentStreak && streak.currentStreak > 0 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                    </svg>
                    {streak.currentStreak}日連続
                  </span>
                )}
                {habit.category && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {getCategoryLabel(habit.category)}
                  </span>
                )}
                {habit.goalValue && (
                  <span className="text-xs text-gray-500">{getGoalText()}</span>
                )}
              </div>

              <div className="mt-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={isCompleted}
                    onCheckedChange={handleToggleCompletion}
                    disabled={toggleCompletionMutation.isPending}
                  />
                  <span className="text-sm font-medium text-gray-900">
                    {isCompleted ? "完了" : "未完了"}
                  </span>
                  {toggleCompletionMutation.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin text-primary ml-2" />
                  )}
                </div>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDeleteHabit} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  削除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="mt-4 border-t border-gray-200 pt-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleOpenNoteDialog}
              className="text-xs"
            >
              <StickyNote className="h-3 w-3 mr-1.5" />
              {record?.notes ? "メモを編集" : "メモを追加"}
            </Button>
            
            {record?.notes && (
              <div className="mt-2 p-2 bg-gray-50 rounded-md text-sm text-gray-600">
                {record.notes}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>メモを追加</DialogTitle>
            <DialogDescription>
              今日の「{habit.name}」の取り組みについてメモを残しましょう
            </DialogDescription>
          </DialogHeader>
          
          <Textarea
            ref={noteInputRef}
            placeholder="今日の取り組みやポイントをメモしましょう"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            className="min-h-[100px]"
          />
          
          <DialogFooter>
            <Button 
              onClick={handleSaveNote} 
              disabled={saveNoteMutation.isPending}
            >
              {saveNoteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>習慣を削除</DialogTitle>
            <DialogDescription>
              「{habit.name}」を削除します。この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              キャンセル
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteHabit}
              disabled={deleteHabitMutation.isPending}
            >
              {deleteHabitMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              削除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
