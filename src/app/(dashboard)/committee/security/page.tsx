// src/app/(dashboard)/committee/security/page.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
  Eye,
  Clock,
  User,
  Globe,
  Database,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { StatsCard } from "@/components/shared/StatsCard";
import { Pagination } from "@/components/shared/Pagination";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  resource: string;
  resource_id: string | null;
  status: string;
  ip_address: string | null;
  created_at: string;
  old_values: any;
  new_values: any;
}

const ACTION_COLORS: Record<string, string> = {
  LOGIN: "bg-green-100 text-green-700",
  LOGOUT: "bg-zinc-100 text-zinc-600",
  CREATE: "bg-blue-100 text-blue-700",
  UPDATE: "bg-yellow-100 text-yellow-700",
  DELETE: "bg-red-100 text-red-700",
  APPROVE: "bg-purple-100 text-purple-700",
  REJECT: "bg-orange-100 text-orange-700",
};

export default function SecurityDashboardPage() {
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

  useEffect(() => {
    fetchAuditLogs();
  }, [activeTab, page]);

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
        const logs = data.data || [];
        setAuditLogs(logs);
        setPagination({
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 1,
          hasNext: data.pagination?.hasNext || false,
          hasPrev: data.pagination?.hasPrev || false,
        });

        // Calculate stats
        const uniqueIPs = new Set(
          logs.map((l: AuditLog) => l.ip_address).filter(Boolean),
        ).size;

        setStats({
          totalActions: data.pagination?.total || 0,
          loginCount: logs.filter((l: AuditLog) => l.action === "LOGIN").length,
          failedActions: logs.filter((l: AuditLog) => l.status === "FAILED")
            .length,
          uniqueIPs,
        });
      }
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    {
      key: "action",
      label: "Action",
      render: (log: AuditLog) => (
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
            ACTION_COLORS[log.action] || "bg-zinc-100 text-zinc-700",
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
          <p className="text-sm font-medium capitalize">{log.resource}</p>
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
            log.status === "SUCCESS" ? "text-green-600" : "text-red-600",
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security Dashboard"
        description="Monitor all system activities and audit logs"
        icon={Shield}
      />

      {/* Security Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatsCard
          title="Total Actions"
          value={stats.totalActions}
          icon={Activity}
          color="blue"
          subtitle="All time"
        />
        <StatsCard
          title="Login Events"
          value={stats.loginCount}
          icon={User}
          color="green"
          subtitle="Recorded"
        />
        <StatsCard
          title="Failed Actions"
          value={stats.failedActions}
          icon={AlertTriangle}
          color={stats.failedActions > 0 ? "red" : "green"}
          subtitle="Needs attention"
        />
        <StatsCard
          title="Unique IPs"
          value={stats.uniqueIPs}
          icon={Globe}
          color="default"
          subtitle="On this page"
        />
      </div>

      {/* Security Info Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-green-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <p className="text-sm font-semibold text-green-800">
              JWT Authentication
            </p>
          </div>
          <p className="text-xs text-green-700">
            All sessions secured with short-lived JWT tokens (15 min) + refresh
            tokens (7 days)
          </p>
        </div>

        <div className="rounded-xl border bg-blue-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-blue-600" />
            <p className="text-sm font-semibold text-blue-800">
              Rate Limiting Active
            </p>
          </div>
          <p className="text-xs text-blue-700">
            Redis-based rate limiting: 3 OTPs/hour per email, 100 API
            requests/minute per IP
          </p>
        </div>

        <div className="rounded-xl border bg-purple-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Database className="h-4 w-4 text-purple-600" />
            <p className="text-sm font-semibold text-purple-800">
              Tamper-Evident Votes
            </p>
          </div>
          <p className="text-xs text-purple-700">
            Each vote secured with SHA-256 hash of pollId + flatId + optionId +
            timestamp
          </p>
        </div>
      </div>

      {/* Audit Log Table */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Audit Trail</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(v) => {
              setActiveTab(v);
              setPage(1);
            }}
            className="mb-4"
          >
            <TabsList className="grid grid-cols-5 w-full max-w-lg">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="create">Create</TabsTrigger>
              <TabsTrigger value="update">Update</TabsTrigger>
              <TabsTrigger value="delete">Delete</TabsTrigger>
            </TabsList>
          </Tabs>

          <DataTable
            data={auditLogs}
            columns={columns}
            isLoading={isLoading}
            keyExtractor={(log) => log.id}
            emptyTitle="No audit logs"
            emptyDescription="System actions will be logged here"
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
        </CardContent>
      </Card>
    </div>
  );
}
