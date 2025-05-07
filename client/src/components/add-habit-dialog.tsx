import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const habitSchema = z.object({
  name: z.string().min(1, "習慣の名前を入力してください"),
  description: z.string().optional(),
  goalValue: z.string().optional().transform((val) => val ? parseInt(val) : undefined),
  goalUnit: z.string().optional(),
  category: z.string().optional(),
});

type HabitFormValues = z.infer<typeof habitSchema>;

interface AddHabitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitSuccess?: () => void;
}

export default function AddHabitDialog({ 
  open, 
  onOpenChange,
  onSubmitSuccess
}: AddHabitDialogProps) {
  const { toast } = useToast();
  
  const form = useForm<HabitFormValues>({
    resolver: zodResolver(habitSchema),
    defaultValues: {
      name: "",
      description: "",
      goalValue: "",
      goalUnit: "個",
      category: "other",
    },
  });

  const addHabitMutation = useMutation({
    mutationFn: async (values: HabitFormValues) => {
      return await apiRequest("POST", "/api/habits", values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/today"] });
      form.reset();
      onOpenChange(false);
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
      toast({
        title: "習慣を追加しました",
        description: "新しい習慣が追加されました",
      });
    },
    onError: (error) => {
      toast({
        title: "エラーが発生しました",
        description: error instanceof Error ? error.message : "習慣の追加に失敗しました",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (values: HabitFormValues) => {
    addHabitMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>新しい習慣を追加</DialogTitle>
          <DialogDescription>
            勉強や学習の習慣を追加して、毎日のチェックインを記録しましょう
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>習慣の名前</FormLabel>
                  <FormControl>
                    <Input placeholder="例：英単語学習" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>詳細（任意）</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="例：毎日20個の新しい単語を覚える" 
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="goalValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>目標数値（任意）</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="20" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="goalUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>単位</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="単位を選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="個">個</SelectItem>
                        <SelectItem value="分">分</SelectItem>
                        <SelectItem value="時間">時間</SelectItem>
                        <SelectItem value="ページ">ページ</SelectItem>
                        <SelectItem value="回">回</SelectItem>
                        <SelectItem value="問">問</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>カテゴリ</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="カテゴリを選択" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="language">語学</SelectItem>
                      <SelectItem value="programming">プログラミング</SelectItem>
                      <SelectItem value="qualification">資格</SelectItem>
                      <SelectItem value="business">ビジネススキル</SelectItem>
                      <SelectItem value="reading">読書</SelectItem>
                      <SelectItem value="other">その他</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                キャンセル
              </Button>
              <Button 
                type="submit"
                disabled={addHabitMutation.isPending}
              >
                {addHabitMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                追加する
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
