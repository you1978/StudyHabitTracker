import { Link, useLocation } from "wouter";
import { Home, BarChart2, Settings } from "lucide-react";

interface MobileNavProps {
  activeTab?: string;
}

export default function MobileNav({ activeTab }: MobileNavProps) {
  const [location] = useLocation();

  // Determine active tab
  const getActiveTab = () => {
    if (activeTab) return activeTab;
    if (location === "/") return "home";
    if (location === "/analytics") return "analytics";
    if (location === "/settings") return "settings";
    return "";
  };

  const active = getActiveTab();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 pt-2 pb-4 z-50">
      <div className="flex justify-around">
        <Link href="/" className={`${active === "home" ? "text-primary" : "text-gray-500"} flex flex-col items-center`}>
          <Home className="h-5 w-5" />
          <span className="text-xs mt-1">ホーム</span>
        </Link>
        <Link href="/analytics" className={`${active === "analytics" ? "text-primary" : "text-gray-500"} flex flex-col items-center`}>
          <BarChart2 className="h-5 w-5" />
          <span className="text-xs mt-1">分析</span>
        </Link>
        <Link href="/settings" className={`${active === "settings" ? "text-primary" : "text-gray-500"} flex flex-col items-center`}>
          <Settings className="h-5 w-5" />
          <span className="text-xs mt-1">設定</span>
        </Link>
      </div>
    </div>
  );
}
