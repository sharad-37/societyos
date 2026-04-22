// src/components/shared/StatsCard.tsx
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  color?: "default" | "green" | "red" | "blue" | "yellow";
  className?: string;
}

const colorMap = {
  default: {
    icon: "bg-zinc-100 text-zinc-700",
    trend: "text-zinc-600",
  },
  green: {
    icon: "bg-green-100 text-green-700",
    trend: "text-green-600",
  },
  red: {
    icon: "bg-red-100 text-red-700",
    trend: "text-red-600",
  },
  blue: {
    icon: "bg-blue-100 text-blue-700",
    trend: "text-blue-600",
  },
  yellow: {
    icon: "bg-yellow-100 text-yellow-700",
    trend: "text-yellow-600",
  },
};

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "default",
  className,
}: StatsCardProps) {
  const colors = colorMap[color];

  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
            {subtitle && (
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <p
                className={cn(
                  "mt-2 text-xs font-medium",
                  trend.positive ? "text-green-600" : "text-red-600",
                )}
              >
                {trend.positive ? "↑" : "↓"} {trend.value}% {trend.label}
              </p>
            )}
          </div>
          <div className={cn("rounded-xl p-3", colors.icon)}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
