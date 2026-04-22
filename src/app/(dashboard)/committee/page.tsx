// src/app/(dashboard)/committee/page.tsx
"use client";

import { useEffect, useState } from "react";
import {
  IndianRupee,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  CreditCard,
  CheckCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/shared/StatsCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useAuth } from "@/hooks/useAuth";
import { formatINR, formatDateShort } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────
interface DashboardStats {
  totalCollected: number;
  totalPending: number;
  openComplaints: number;
  overdueCount: number;
}

interface BillItem {
  id: string;
  bill_number: string;
  status: string;
  total_amount: string;
  flat: { flat_number: string; wing: string | null } | null;
}

interface ComplaintItem {
  id: string;
  complaint_number: string;
  title: string;
  priority: string;
  status: string;
  raised_by_user: {
    flat: { flat_number: string } | null;
  } | null;
}

// ─── Chart Data ───────────────────────────────────────────────
const billingChartData = [
  { month: "Feb", collected: 85000, pending: 15000 },
  { month: "Mar", collected: 92000, pending: 8000 },
  { month: "Apr", collected: 78000, pending: 22000 },
  { month: "May", collected: 95000, pending: 5000 },
  { month: "Jun", collected: 88000, pending: 12000 },
  { month: "Jul", collected: 72000, pending: 28000 },
];

const expenseChartData = [
  { name: "Security", value: 35000, color: "#ef4444" },
  { name: "Cleaning", value: 18000, color: "#f97316" },
  { name: "Electricity", value: 25000, color: "#eab308" },
  { name: "Maintenance", value: 42000, color: "#22c55e" },
  { name: "Other", value: 12000, color: "#8b5cf6" },
];

// ─── Tooltip Types ────────────────────────────────────────────
interface TooltipPayload {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

// ─── Custom Tooltip Component ─────────────────────────────────
function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-white p-3 shadow-lg text-sm">
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {formatINR(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

// ─── Page Component ───────────────────────────────────────────
export default function CommitteeDashboard() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalCollected: 0,
    totalPending: 0,
    openComplaints: 0,
    overdueCount: 0,
  });
  const [recentComplaints, setRecentComplaints] = useState<ComplaintItem[]>([]);
  const [recentBills, setRecentBills] = useState<BillItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [billsRes, complaintsRes] = await Promise.all([
          fetch("/api/billing?limit=5"),
          fetch("/api/complaints?limit=5&status=OPEN"),
        ]);

        const [billsData, complaintsData] = await Promise.all([
          billsRes.json(),
          complaintsRes.json(),
        ]);

        const bills: BillItem[] = billsData.data || [];
        const complaints: ComplaintItem[] = complaintsData.data || [];

        const collected = bills
          .filter((b) => b.status === "PAID")
          .reduce((sum, b) => sum + Number(b.total_amount), 0);

        const pending = bills
          .filter((b) => b.status === "PENDING" || b.status === "OVERDUE")
          .reduce((sum, b) => sum + Number(b.total_amount), 0);

        setStats({
          totalCollected: collected,
          totalPending: pending,
          openComplaints: complaintsData.pagination?.total || complaints.length,
          overdueCount: bills.filter((b) => b.status === "OVERDUE").length,
        });

        setRecentComplaints(complaints.slice(0, 5));
        setRecentBills(bills.slice(0, 5));
      } catch (error) {
        console.error("Dashboard error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-zinc-950 p-6 text-white">
        <h2 className="text-xl font-bold">Committee Dashboard 🏢</h2>
        <p className="mt-1 text-zinc-400 text-sm">
          {user?.societyName} •{" "}
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatsCard
          title="Collected"
          value={formatINR(stats.totalCollected)}
          icon={IndianRupee}
          color="green"
        />
        <StatsCard
          title="Pending"
          value={formatINR(stats.totalPending)}
          icon={CreditCard}
          color="yellow"
        />
        <StatsCard
          title="Open Complaints"
          value={stats.openComplaints}
          icon={MessageSquare}
          color={stats.openComplaints > 10 ? "red" : "blue"}
        />
        <StatsCard
          title="Overdue Bills"
          value={stats.overdueCount}
          icon={AlertTriangle}
          color={stats.overdueCount > 0 ? "red" : "green"}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Billing Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Billing Overview (Last 6 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={billingChartData} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="collected"
                  name="Collected"
                  fill="#22c55e"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="pending"
                  name="Pending"
                  fill="#fbbf24"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Expense Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Expense Breakdown (This Month)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={expenseChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {expenseChartData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) =>
                    value !== undefined ? formatINR(Number(value)) : ""
                  }
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value: string) => (
                    <span style={{ fontSize: 12 }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      {/* Tables Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Complaints */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Open Complaints
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentComplaints.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
                <p className="text-sm text-muted-foreground">
                  No open complaints! 🎉
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentComplaints.map((complaint) => (
                  <div
                    key={complaint.id}
                    className="flex items-start justify-between rounded-lg border p-3 hover:bg-zinc-50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {complaint.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {complaint.complaint_number} • Flat{" "}
                        {complaint.raised_by_user?.flat?.flat_number ?? "N/A"}
                      </p>
                    </div>
                    <div className="ml-2 flex-shrink-0">
                      <StatusBadge
                        status={complaint.priority}
                        type="complaint-priority"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Bills */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Recent Bills
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentBills.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <CreditCard className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No bills generated yet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentBills.map((bill) => (
                  <div
                    key={bill.id}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-zinc-50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {bill.flat?.wing
                          ? `${bill.flat.wing}-${bill.flat.flat_number}`
                          : (bill.flat?.flat_number ?? "N/A")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {bill.bill_number}
                      </p>
                    </div>
                    <div className="ml-2 flex flex-col items-end gap-1">
                      <p className="text-sm font-bold">
                        {formatINR(Number(bill.total_amount))}
                      </p>
                      <StatusBadge status={bill.status} type="bill" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
