import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/header";
import MobileNav from "@/components/mobile-nav";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut, User, Lock } from "lucide-react";

const profileSchema = z.object({
  nickname: z.string().optional(),
  goalField: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "現在のパスワードを入力してください"),
  newPassword: z.string().min(6, "パスワードは6文字以上で入力してください"),
  confirmPassword: z.string().min(1, "確認用パスワードを入力してください"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "新しいパスワードが一致しません",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nickname: user?.nickname || "",
      goalField: user?.goalField || "",
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onProfileSubmit = async (data: ProfileFormValues) => {
    setProfileLoading(true);
    try {
      await apiRequest("PUT", "/api/profile", data);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "プロフィールを更新しました",
        description: "変更が保存されました",
      });
    } catch (error) {
      toast({
        title: "エラーが発生しました",
        description: error instanceof Error ? error.message : "プロフィールの更新に失敗しました",
        variant: "destructive",
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormValues) => {
    // This is a stub since we're not implementing password change in this MVP
    setPasswordLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "機能制限",
        description: "パスワード変更機能は現在実装中です",
        variant: "destructive",
      });
      setPasswordLoading(false);
      passwordForm.reset();
    }, 1000);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 pb-16 md:pb-0">
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold leading-7 text-gray-900 sm:text-2xl">
              設定
            </h2>
            <p className="mt-1 text-sm text-gray-500">アカウント設定と個人情報を管理できます</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profile Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  プロフィール設定
                </CardTitle>
                <CardDescription>
                  個人情報や目標分野を設定します
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                    <FormField
                      control={profileForm.control}
                      name="nickname"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ニックネーム</FormLabel>
                          <FormControl>
                            <Input placeholder="ニックネーム" {...field} />
                          </FormControl>
                          <FormDescription>
                            アプリ内で表示される名前です
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="goalField"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>目標分野</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="選択してください" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="language">語学</SelectItem>
                              <SelectItem value="programming">プログラミング</SelectItem>
                              <SelectItem value="qualification">資格</SelectItem>
                              <SelectItem value="business">ビジネススキル</SelectItem>
                              <SelectItem value="other">その他</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            主に取り組みたい学習分野
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={profileLoading}>
                      {profileLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      保存する
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Password Change */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lock className="h-5 w-5 mr-2" />
                  パスワード変更
                </CardTitle>
                <CardDescription>
                  アカウントのパスワードを変更します
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>現在のパスワード</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="現在のパスワード" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>新しいパスワード</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="新しいパスワード" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>新しいパスワード（確認）</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="新しいパスワード（確認）" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={passwordLoading}>
                      {passwordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      パスワードを変更
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Logout Section */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <LogOut className="h-5 w-5 mr-2" />
                ログアウト
              </CardTitle>
              <CardDescription>
                アカウントからログアウトします
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                ログアウトするとすべてのデバイスからサインアウトします。再度ログインするにはユーザー名とパスワードが必要です。
              </p>
              <Button 
                variant="destructive" 
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                ログアウト
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <MobileNav activeTab="settings" />
    </div>
  );
}
