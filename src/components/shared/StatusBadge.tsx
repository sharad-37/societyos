// src/components/shared/StatusBadge.tsx
import {
  cn,
  getBillStatusColor,
  getComplaintPriorityColor,
  getComplaintStatusColor,
} from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  type: "bill" | "complaint-status" | "complaint-priority" | "custom";
  className?: string;
}

export function StatusBadge({ status, type, className }: StatusBadgeProps) {
  let colorClass = "";

  switch (type) {
    case "bill":
      colorClass = getBillStatusColor(status);
      break;
    case "complaint-status":
      colorClass = getComplaintStatusColor(status);
      break;
    case "complaint-priority":
      colorClass = getComplaintPriorityColor(status);
      break;
    default:
      colorClass = "text-gray-600 bg-gray-50 border-gray-200";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        colorClass,
        className,
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
