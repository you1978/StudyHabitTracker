import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ProgressSummaryProps {
  completed: number;
  total: number;
}

export default function ProgressSummary({ completed, total }: ProgressSummaryProps) {
  const progress = total > 0 ? (completed / total) * 100 : 0;
  
  return (
    <Card className="mt-2">
      <CardContent className="p-5">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-medium text-gray-700">完了した習慣</span>
          <span className="text-sm font-medium text-primary">{completed}/{total}</span>
        </div>
        <Progress value={progress} className="h-2.5" />
      </CardContent>
    </Card>
  );
}
