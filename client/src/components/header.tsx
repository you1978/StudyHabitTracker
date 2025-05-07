import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings, User } from "lucide-react";

export default function Header() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  const isActive = (path: string) => {
    return location === path;
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <>
      {/* Navigation for desktop */}
      <nav className="bg-white shadow-sm hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-primary">習慣化アプリ</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link href="/">
                  <a className={`${isActive('/') ? 'border-primary text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                    ホーム
                  </a>
                </Link>
                <Link href="/analytics">
                  <a className={`${isActive('/analytics') ? 'border-primary text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                    分析
                  </a>
                </Link>
                <Link href="/settings">
                  <a className={`${isActive('/settings') ? 'border-primary text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                    設定
                  </a>
                </Link>
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <div className="ml-3 relative">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center max-w-xs bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                      <span className="sr-only">ユーザーメニューを開く</span>
                      <Avatar>
                        <AvatarFallback>
                          {user?.nickname 
                            ? getInitials(user.nickname)
                            : user?.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/settings">
                        <a className="flex items-center">
                          <Settings className="mr-2 h-4 w-4" />
                          <span>設定</span>
                        </a>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>ログアウト</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile header */}
      <div className="md:hidden bg-white shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-primary">習慣化アプリ</h1>
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center max-w-xs bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                  <Avatar>
                    <AvatarFallback>
                      {user?.nickname 
                        ? getInitials(user.nickname)
                        : user?.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <a className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>設定</span>
                    </a>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>ログアウト</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </>
  );
}
