// src/components/ui/apple-components.tsx
"use client";

import { cn } from "@/lib/utils";
import {
  LucideIcon,
  ChevronRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

// ─── Animated Number ──────────────────────────────────────────
function useAnimatedNumber(target: number, duration = 1000): number {
  const [current, setCurrent] = useState<number>(0);
  const startTimeRef = useRef<number | null>(null);
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    startTimeRef.current = null;
    setCurrent(0);
    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.floor(eased * target));
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current !== undefined)
        cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration]);

  return current;
}

// ─── AppleCard ────────────────────────────────────────────────
export function AppleCard({
  children,
  className,
  padding = "md",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
  onClick?: () => void;
}) {
  const paddingMap = { none: "", sm: "p-4", md: "p-5", lg: "p-6" };
  return (
    <div
      onClick={onClick}
      className={cn(
        "apple-card",
        paddingMap[padding],
        onClick && "cursor-pointer",
        className,
      )}
    >
      {children}
    </div>
  );
}

// ─── AppleStatsCard ───────────────────────────────────────────
export function AppleStatsCard({
  label,
  value,
  sublabel,
  icon: Icon,
  iconColor = "bg-blue-500",
  trend,
  className,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: LucideIcon;
  iconColor?: string;
  trend?: { value: string; positive: boolean };
  className?: string;
}) {
  const isNumber = typeof value === "number";
  const animated = useAnimatedNumber(isNumber ? (value as number) : 0);
  const display = isNumber ? animated : value;

  return (
    <div className={cn("apple-card p-5", className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
            {label}
          </p>
          <p className="stat-number text-zinc-900 dark:text-white">{display}</p>
          {sublabel && (
            <p className="text-xs text-zinc-400 mt-1.5">{sublabel}</p>
          )}
          {trend && (
            <div
              className={cn(
                "inline-flex items-center gap-1 mt-2 text-xs font-semibold px-2 py-0.5 rounded-full",
                trend.positive
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
              )}
            >
              {trend.positive ? "↑" : "↓"} {trend.value}
            </div>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              "h-11 w-11 rounded-2xl flex items-center justify-center flex-shrink-0",
              iconColor,
            )}
          >
            <Icon className="h-5 w-5 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── AppleListItem ────────────────────────────────────────────
export function AppleListItem({
  icon: Icon,
  iconColor = "bg-blue-500",
  title,
  subtitle,
  right,
  showChevron = false,
  onClick,
  className,
}: {
  icon?: LucideIcon;
  iconColor?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  showChevron?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <div onClick={onClick} className={cn("list-item-apple", className)}>
      {Icon && (
        <div
          className={cn(
            "h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0",
            iconColor,
          )}
        >
          <Icon className="h-[18px] w-[18px] text-white" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
          {title}
        </p>
        {subtitle && (
          <p className="text-xs text-zinc-400 mt-0.5 truncate">{subtitle}</p>
        )}
      </div>
      {right && <div className="flex-shrink-0 text-right">{right}</div>}
      {showChevron && (
        <ChevronRight className="h-4 w-4 text-zinc-300 flex-shrink-0" />
      )}
    </div>
  );
}

// ─── AppleSection ─────────────────────────────────────────────
export function AppleSection({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between px-1">
          {title && <p className="section-header">{title}</p>}
          {action && (
            <div className="text-sm font-medium text-blue-500 cursor-pointer hover:text-blue-600 transition-colors">
              {action}
            </div>
          )}
        </div>
      )}
      <div className="apple-card overflow-hidden p-0">{children}</div>
    </div>
  );
}

// ─── AppleButton ──────────────────────────────────────────────
export function AppleButton({
  children,
  variant = "primary",
  size = "md",
  icon: Icon,
  iconPosition = "left",
  loading = false,
  disabled = false,
  onClick,
  className,
  type = "button",
  fullWidth = false,
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "destructive" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit" | "reset";
  fullWidth?: boolean;
}) {
  const variantClass = {
    primary: "btn-apple-primary",
    secondary: "btn-apple-secondary",
    destructive: "btn-apple-destructive",
    ghost:
      "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors",
  };
  const sizeClass = {
    sm: "!px-3.5 !py-2 !text-xs",
    md: "!px-5 !py-2.5 !text-sm",
    lg: "!px-6 !py-3 !text-base",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        variantClass[variant],
        variant !== "ghost" && sizeClass[size],
        fullWidth && "w-full",
        (disabled || loading) &&
          "opacity-50 cursor-not-allowed pointer-events-none",
        className,
      )}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
              strokeOpacity="0.25"
            />
            <path
              d="M12 2a10 10 0 0 1 10 10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          Loading...
        </div>
      ) : (
        <>
          {Icon && iconPosition === "left" && <Icon className="h-4 w-4" />}
          {children}
          {Icon && iconPosition === "right" && <Icon className="h-4 w-4" />}
        </>
      )}
    </button>
  );
}

// ─── AppleInput ───────────────────────────────────────────────
export function AppleInput({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  error,
  success,
  hint,
  icon: Icon,
  disabled,
  required,
  className,
}: {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  error?: string;
  success?: boolean;
  hint?: string;
  icon?: LucideIcon;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
            <Icon
              className={cn(
                "h-4 w-4 transition-colors",
                focused ? "text-blue-500" : "text-zinc-400",
              )}
            />
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={cn(
            "input-apple",
            Icon && "pl-10",
            error && "error",
            success && !error && "success",
            disabled && "opacity-50 cursor-not-allowed",
          )}
        />
        {success && !error && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center">
              <svg
                className="h-2.5 w-2.5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <svg
            className="h-3 w-3 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
      {hint && !error && <p className="text-xs text-zinc-400">{hint}</p>}
    </div>
  );
}

// ─── AppleBadge ───────────────────────────────────────────────
export function AppleBadge({
  children,
  color = "blue",
  dot = false,
  className,
}: {
  children: React.ReactNode;
  color?: "blue" | "green" | "red" | "orange" | "purple" | "gray";
  dot?: boolean;
  className?: string;
}) {
  const dotColor = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    red: "bg-red-500",
    orange: "bg-orange-500",
    purple: "bg-purple-500",
    gray: "bg-zinc-400",
  };

  return (
    <span className={cn("badge-apple", `badge-${color}`, className)}>
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full flex-shrink-0",
            dotColor[color],
          )}
        />
      )}
      {children}
    </span>
  );
}

// ─── AppleEmptyState ──────────────────────────────────────────
export function AppleEmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        className,
      )}
    >
      <div className="h-16 w-16 rounded-3xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
        <Icon className="h-7 w-7 text-zinc-400" />
      </div>
      <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-1.5">
        {title}
      </h3>
      <p className="text-sm text-zinc-400 max-w-xs leading-relaxed mb-6">
        {description}
      </p>
      {action}
    </div>
  );
}

// ─── AppleSkeleton ────────────────────────────────────────────
export function AppleSkeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

export function AppleCardSkeleton() {
  return (
    <div className="apple-card p-5 space-y-3">
      <div className="flex items-center gap-3">
        <AppleSkeleton className="h-9 w-9 rounded-xl" />
        <div className="space-y-2 flex-1">
          <AppleSkeleton className="h-3 w-24" />
          <AppleSkeleton className="h-4 w-36" />
        </div>
      </div>
      <AppleSkeleton className="h-3 w-full" />
      <AppleSkeleton className="h-3 w-3/4" />
    </div>
  );
}

// ─── AppleAvatar ──────────────────────────────────────────────
const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-orange-500",
  "bg-green-500",
  "bg-teal-500",
  "bg-indigo-500",
  "bg-red-500",
];

function getAvatarColor(name: string): string {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function AppleAvatar({
  name,
  size = "md",
  src,
  color,
  className,
}: {
  name: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  src?: string;
  color?: string;
  className?: string;
}) {
  const sizeMap = {
    xs: "h-6 w-6 text-[9px]",
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
    xl: "h-16 w-16 text-lg",
  };
  const bgColor = color || getAvatarColor(name);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn("rounded-full object-cover", sizeMap[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-white select-none",
        bgColor,
        sizeMap[size],
        className,
      )}
    >
      {getInitials(name)}
    </div>
  );
}

// ─── AppleProgress ────────────────────────────────────────────
export function AppleProgress({
  value,
  max = 100,
  color = "bg-blue-500",
  label,
  showValue = false,
  className,
}: {
  value: number;
  max?: number;
  color?: string;
  label?: string;
  showValue?: boolean;
  className?: string;
}) {
  const pct = Math.min((value / max) * 100, 100);

  return (
    <div className={cn("space-y-1.5", className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && (
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              {label}
            </p>
          )}
          {showValue && (
            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              {Math.round(pct)}%
            </p>
          )}
        </div>
      )}
      <div className="progress-apple">
        <div
          className={cn("progress-apple-fill", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
