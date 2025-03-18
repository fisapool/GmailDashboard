import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatusCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: "primary" | "success" | "warning" | "error";
}

export default function StatusCard({ title, value, icon: Icon, color }: StatusCardProps) {
  const getBackgroundColor = () => {
    switch (color) {
      case "primary":
        return "bg-blue-50";
      case "success":
        return "bg-green-50";
      case "warning":
        return "bg-yellow-50";
      case "error":
        return "bg-red-50";
      default:
        return "bg-blue-50";
    }
  };

  const getIconColor = () => {
    switch (color) {
      case "primary":
        return "text-primary";
      case "success":
        return "text-green-500";
      case "warning":
        return "text-yellow-500";
      case "error":
        return "text-red-500";
      default:
        return "text-primary";
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start">
          <div className={cn("p-2 rounded mr-4", getBackgroundColor())}>
            <Icon className={cn("h-5 w-5", getIconColor())} />
          </div>
          <div>
            <p className="text-gray-600 text-sm">{title}</p>
            <h3 className="text-2xl font-medium">{value}</h3>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
