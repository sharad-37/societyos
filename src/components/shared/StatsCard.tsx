// src/components/shared/StatsCard.tsx
"use client";

import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

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
  color?: "default" | "green" | "red" | "blue" | "yellow" | "purple" | "orange";
  className?: string;
  animate?: boolean;
}

const colorConfig = {
  default: {
    icon: "bg-zinc-100 text-zinc-700",
    glow: "",
    gradient: "from-zinc-50 to-white",
    accent: "bg-zinc-500",
  },
  green: {
    icon: "bg-green-100 text-green-700",
    glow: "shadow-green-100",
    gradient: "from-green-50 to-white",
    accent: "bg-green-500",
  },
  red: {
    icon: "bg-red-100 text-red-700",
    glow: "shadow-red-100",
    gradient: "from-red-50 to-white",
    accent: "bg-red-500",
  },
  blue: {
    icon: "bg-blue-100 text-blue-700",
    glow: "shadow-blue-100",
    gradient: "from-blue-50 to-white",
    accent: "bg-blue-500",
  },
  yellow: {
    icon: "bg-amber-100 text-amber-700",
    glow: "shadow-amber-100",
    gradient: "from-amber-50 to-white",
    accent: "bg-amber-500",
  },
  purple: {
    icon: "bg-purple-100 text-purple-700",
    glow: "shadow-purple-100",
    gradient: "from-purple-50 to-white",
    accent: "bg-purple-500",
  },
  orange: {
    icon: "bg-orange-100 text-orange-700",
    glow: "shadow-orange-100",
    gradient: "from-orange-50 to-white",
    accent: "bg-orange-500",
  },
};

// Animated number hook
function useAnimatedNumber(target: number, duration: number = 1000) {
  const [current, setCurrent] = useState(0);
  const startTime = useRef<number | null>(null);
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const elapsed = timestamp - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic
      setCurrent(Math.floor(eased * target));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [target, duration]);

  return current;
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "default",
  className,
  animate = true,
}: StatsCardProps) {
  const config = colorConfig[color];
  const isNumber = typeof value === "number";
  const animatedValue = useAnimatedNumber(
    isNumber && animate ? (value as number) : 0,
  );

  const displayValue = isNumber && animate ? animatedValue : value;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-white p-6",
        "card-hover cursor-default",
        "shadow-sm hover:shadow-md",
        config.glow,
        className,
      )}
    >
      {/* Subtle gradient background */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-40",
          config.gradient,
        )}
      />

      {/* Accent line at top */}
      <div
        className={cn("absolute top-0 left-0 right-0 h-0.5", config.accent)}
      />

      <div className="relative">
        {/* Top row */}
        <div className="flex items-start justify-between mb-4">
          <div className={cn("rounded-xl p-2.5", config.icon)}>
            <Icon className="h-5 w-5" />
          </div>

          {trend && (
            <div
              className={cn(
                "flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full",
                trend.positive
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700",
              )}
            >
              {trend.positive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {trend.value}%
            </div>
          )}
        </div>

        {/* Value */}
        <div className="mb-1">
          <span className="text-2xl font-bold tracking-tight text-zinc-900">
            {displayValue}
          </span>
        </div>

        {/* Title */}
        <p className="text-sm font-medium text-zinc-600">{title}</p>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}

        {/* Trend label */}
        {trend && (
          <p className="text-xs text-muted-foreground mt-1">{trend.label}</p>
        )}
      </div>
    </div>
  );
}
