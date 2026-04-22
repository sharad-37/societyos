// src/components/shared/PageHeader.tsx
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn("flex items-start justify-between gap-4 mb-6", className)}
    >
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="rounded-xl bg-zinc-100 p-2.5 mt-0.5">
            <Icon className="h-5 w-5 text-zinc-700" />
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-zinc-900">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
