// src/app/(dashboard)/committee/security/page.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
  Globe,
  Database,
  User,
  RefreshCw,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import {
  AppleStatsCard,
  AppleCardSkeleton,
} from "@/components/ui/apple-components";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────
interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  resource: string;
  resource_id: string | null;
  status: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  old_values: any;
  new_values: any;
}

// ─── Action Color Map ─────────────────────────────────────────
const ACTION_COLORS: Record<string, string> = {
  LOGIN: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  LOGOUT: "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400",
  CREATE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  UPDATE:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  APPROVE:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  REJECT:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  EXPORT: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
};

// ─── Security Feature Cards ───────────────────────────────────
const securityFeatures = [
  {
    icon: Shield,
    color: "bg-green-500",
    title: "JWT Authentication",
    description:
      "Short-lived access tokens (15 min) + secure refresh tokens (7 days) stored in HttpOnly cookies.",
  },
  {
    icon: Activity,
    color: "bg-blue-500",
    title: "Rate Limiting Active",
    description:
      "Redis-based limiting: 3 OTPs/hour per email, 100 API requests/min per IP address.",
  },
  {
    icon: Database,
    color: "bg-purple-500",
    title: "Tamper-Evident Votes",
    description:
      "Every vote secured with SHA-256 hash of pollId + flatId + optionId + timestamp.",
  },
  {
    icon: Globe,
    color: "bg-orange-500",
    title: "Multi-Tenant Isolation",
    description:
      "Complete data isolation via society_id. No cross-tenant data leakage possible.",
  },
];

// ─── Component ────────────────────────────────────────────────
export default function SecurityDashboardPage() {
  // ── State ──────────────────────────────────────────────────
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [stats, setStats] = useState({
    totalActions: 0,
    loginCount: 0,
    failedActions: 0,
    uniqueIPs: 0,
  });

  // ── Effects ────────────────────────────────────────────────
  useEffect(() => {
    fetchAuditLogs();
  }, [activeTab, page]);

  // ── Fetch ──────────────────────────────────────────────────
  const fetchAuditLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
        ...(activeTab !== "all" && {
          action: activeTab.toUpperCase(),
        }),
      });

      const response = await fetch(`/api/audit-logs?${params}`);
      const data = await response.json();

      if (data.success) {
        const logs: AuditLog[] = data.data || [];
        setAuditLogs(logs);
        setPagination({
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 1,
          hasNext: data.pagination?.hasNext || false,
          hasPrev: data.pagination?.hasPrev || false,
        });

        // Calculate stats
        const uniqueIPs = new Set(logs.map((l) => l.ip_address).filter(Boolean))
          .size;

        setStats({
          totalActions: data.pagination?.total || 0,
          loginCount: logs.filter((l) => l.action === "LOGIN").length,
          failedActions: logs.filter((l) => l.status === "FAILED").length,
          uniqueIPs,
        });
      }
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Table Columns ──────────────────────────────────────────
  const columns = [
    {
      key: "action",
      label: "Action",
      render: (log: AuditLog) => (
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
            ACTION_COLORS[log.action] ||
              "bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300",
          )}
        >
          {log.action}
        </span>
      ),
    },
    {
      key: "resource",
      label: "Resource",
      render: (log: AuditLog) => (
        <div>
          <p className="text-sm font-medium capitalize text-zinc-900 dark:text-white">
            {log.resource}
          </p>
          {log.resource_id && (
            <p className="text-xs text-muted-foreground font-mono">
              {log.resource_id.slice(0, 8)}...
            </p>
          )}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (log: AuditLog) => (
        <span
          className={cn(
            "inline-flex items-center gap-1 text-xs font-medium",
            log.status === "SUCCESS"
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400",
          )}
        >
          {log.status === "SUCCESS" ? (
            <CheckCircle className="h-3 w-3" />
          ) : (
            <AlertTriangle className="h-3 w-3" />
          )}
          {log.status}
        </span>
      ),
    },
    {
      key: "ip_address",
      label: "IP Address",
      render: (log: AuditLog) => (
        <span className="text-xs font-mono text-muted-foreground">
          {log.ip_address || "—"}
        </span>
      ),
    },
    {
      key: "created_at",
      label: "Time",
      render: (log: AuditLog) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(log.created_at)}
        </span>
      ),
    },
  ];

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Security Dashboard"
        description="Monitor all system activities and audit logs"
        icon={Shield}
        action={
          <Button variant="outline" size="sm" onClick={() => fetchAuditLogs()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        }
      />

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <AppleCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <AppleStatsCard
            label="Total Actions"
            value={stats.totalActions}
            icon={Activity}
            iconColor="bg-blue-500"
            sublabel="All time"
          />
          <AppleStatsCard
            label="Login Events"
            value={stats.loginCount}
            icon={User}
            iconColor="bg-green-500"
            sublabel="Recorded"
          />
          <AppleStatsCard
            label="Failed Actions"
            value={stats.failedActions}
            icon={AlertTriangle}
            iconColor={stats.failedActions > 0 ? "bg-red-500" : "bg-green-500"}
            sublabel="Needs attention"
          />
          <AppleStatsCard
            label="Unique IPs"
            value={stats.uniqueIPs}
            icon={Globe}
            iconColor="bg-purple-500"
            sublabel="On this page"
          />
        </div>
      )}

      {/* Security Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {securityFeatures.map((feature) => (
          <div
            key={feature.title}
            className="apple-card p-5 flex items-start gap-4"
          >
            <div
              className={cn(
                "h-10 w-10 rounded-2xl flex items-center justify-center flex-shrink-0",
                feature.color,
              )}
            >
              <feature.icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                {feature.title}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Audit Log Table */}
      <div className="apple-card overflow-hidden">
        <div className="p-5 pb-4 border-b border-zinc-100 dark:border-zinc-700/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                Audit Trail
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Complete log of all system actions
              </p>
            </div>
          </div>

          {/* Filter Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(v) => {
              setActiveTab(v);
              setPage(1);
            }}
          >
            <TabsList className="grid grid-cols-5 w-full max-w-lg">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="create">Create</TabsTrigger>
              <TabsTrigger value="update">Update</TabsTrigger>
              <TabsTrigger value="delete">Delete</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="p-5">
          <DataTable
            data={auditLogs}
            columns={columns}
            isLoading={isLoading}
            keyExtractor={(log) => log.id}
            emptyTitle="No audit logs found"
            emptyDescription="System actions will be logged here automatically"
          />

          <Pagination
            page={page}
            totalPages={pagination.totalPages}
            hasNext={pagination.hasNext}
            hasPrev={pagination.hasPrev}
            onNext={() => setPage(page + 1)}
            onPrev={() => setPage(page - 1)}
            total={pagination.total}
            limit={20}
          />
        </div>
      </div>
    </div>
  );
}
