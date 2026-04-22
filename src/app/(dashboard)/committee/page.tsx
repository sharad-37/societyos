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
  Users,
  ArrowUpRight,
  BarChart3,
  Activity,
  Zap,
} from "lucide-react";
import {
  AreaChart,
  Area,
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
  RadialBarChart,
  RadialBar,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { StatsCard } from "@/components/shared/StatsCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useAuth } from "@/hooks/useAuth";
import { formatINR, formatDateShort } from "@/lib/utils";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────
interface DashboardStats {
  totalCollected: number;
  totalPending: number;
  openComplaints: number;
  overdueCount: number;
  totalMembers: number;
  collectionRate: number;
}

interface BillItem {
  id: string;
  bill_number: string;
  status: string;
  total_amount: string;
  flat: { flat_number: string; wing: string | null } | null;
  user: { full_name: string } | null;
}

interface ComplaintItem {
  id: string;
  complaint_number: string;
  title: string;
  priority: string;
  status: string;
  created_at: string;
  raised_by_user: {
    full_name: string;
    flat: { flat_number: string } | null;
  } | null;
}

// ─── Chart Data (will be replaced with real API) ──────────────
const areaChartData = [
  { month: "Jan", collected: 72000, target: 85000 },
  { month: "Feb", collected: 85000, target: 85000 },
  { month: "Mar", collected: 92000, target: 88000 },
  { month: "Apr", collected: 78000, target: 88000 },
  { month: "May", collected: 95000, target: 90000 },
  { month: "Jun", collected: 88000, target: 90000 },
  { month: "Jul", collected: 102000, target: 95000 },
];

const expensePieData = [
  { name: "Security", value: 35000, color: "#f97316" },
  { name: "Cleaning", value: 18000, color: "#8b5cf6" },
  { name: "Electricity", value: 25000, color: "#3b82f6" },
  { name: "Maintenance", value: 42000, color: "#22c55e" },
  { name: "Other", value: 12000, color: "#f43f5e" },
];

const complaintCategoryData = [
  { name: "Plumbing", count: 12, color: "#3b82f6" },
  { name: "Electrical", count: 8, color: "#f97316" },
  { name: "Cleaning", count: 15, color: "#22c55e" },
  { name: "Security", count: 5, color: "#f43f5e" },
  { name: "Lift", count: 3, color: "#8b5cf6" },
];

// ─── Custom Tooltip ───────────────────────────────────────────
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
}) {
  if (active && payload && payload.length) {
    return (
      <div className="glass rounded-xl border p-3 shadow-xl text-sm">
        <p className="font-semibold text-zinc-900 mb-1">{label}</p>
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className="h-2 w-2 rounded-full"
              style={{ background: entry.color }}
            />
            <span className="text-zinc-600">{entry.name}:</span>
            <span className="font-semibold">{formatINR(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

// ─── Radial Collection Rate ───────────────────────────────────
function CollectionRateGauge({ rate }: { rate: number }) {
  const data = [
    { name: "Collected", value: rate, fill: "#22c55e" },
    {
      name: "Remaining",
      value: 100 - rate,
      fill: "#f4f4f5",
    },
  ];

  return (
    <div className="relative flex items-center justify-center">
      <ResponsiveContainer width={140} height={140}>
        <RadialBarChart
          innerRadius={45}
          outerRadius={65}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <RadialBar dataKey="value" cornerRadius={8} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute text-center">
        <p className="text-2xl font-black text-zinc-900">{rate}%</p>
        <p className="text-[10px] text-zinc-500 font-medium">Collected</p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function CommitteeDashboard() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalCollected: 0,
    totalPending: 0,
    openComplaints: 0,
    overdueCount: 0,
    totalMembers: 0,
    collectionRate: 0,
  });
  const [recentComplaints, setRecentComplaints] = useState<ComplaintItem[]>([]);
  const [recentBills, setRecentBills] = useState<BillItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [billsRes, complaintsRes, membersRes] = await Promise.all([
          fetch("/api/billing?limit=5"),
          fetch("/api/complaints?limit=5"),
          fetch("/api/members?limit=1"),
        ]);

        const [billsData, complaintsData, membersData] = await Promise.all([
          billsRes.json(),
          complaintsRes.json(),
          membersRes.json(),
        ]);

        const bills: BillItem[] = billsData.data || [];
        const complaints: ComplaintItem[] = complaintsData.data || [];

        const collected = bills
          .filter((b) => b.status === "PAID")
          .reduce((s, b) => s + Number(b.total_amount), 0);

        const pending = bills
          .filter((b) => b.status === "PENDING" || b.status === "OVERDUE")
          .reduce((s, b) => s + Number(b.total_amount), 0);

        const total = collected + pending;
        const rate = total > 0 ? Math.round((collected / total) * 100) : 0;

        setStats({
          totalCollected: collected,
          totalPending: pending,
          openComplaints: complaints.filter((c) => c.status === "OPEN").length,
          overdueCount: bills.filter((b) => b.status === "OVERDUE").length,
          totalMembers: membersData.pagination?.total || 0,
          collectionRate: rate,
        });

        setRecentComplaints(complaints.slice(0, 4));
        setRecentBills(bills.slice(0, 4));
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
      <div className="space-y-6 animate-pulse">
        {/* Skeleton loading */}
        <div className="h-28 rounded-2xl bg-zinc-200" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-zinc-200" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 rounded-2xl bg-zinc-200" />
          <div className="h-64 rounded-2xl bg-zinc-200" />
        </div>
      </div>
    );
  }

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-6 stagger-children">
      {/* ── HERO WELCOME BANNER ──────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-zinc-950 p-6 text-white">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl" />

        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-zinc-400 text-sm mb-1">
              {greeting()},{" "}
              <span className="text-white font-medium">
                {user?.fullName?.split(" ")[0]}
              </span>{" "}
              👋
            </p>
            <h1 className="text-2xl font-bold">Committee Dashboard</h1>
            <p className="text-zinc-400 text-sm mt-1">
              {user?.societyName} •{" "}
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          {/* Quick collection rate display */}
          <div className="hidden sm:block">
            <CollectionRateGauge rate={stats.collectionRate} />
          </div>
        </div>

        {/* Quick stats strip */}
        <div className="relative mt-4 flex items-center gap-6 pt-4 border-t border-zinc-800">
          <div className="text-center">
            <p className="text-xl font-bold text-green-400">
              {formatINR(stats.totalCollected)}
            </p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
              Collected
            </p>
          </div>
          <div className="h-8 w-px bg-zinc-800" />
          <div className="text-center">
            <p className="text-xl font-bold text-amber-400">
              {formatINR(stats.totalPending)}
            </p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
              Pending
            </p>
          </div>
          <div className="h-8 w-px bg-zinc-800" />
          <div className="text-center">
            <p className="text-xl font-bold text-red-400">
              {stats.openComplaints}
            </p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
              Open Issues
            </p>
          </div>
        </div>
      </div>

      {/* ── STATS GRID ───────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatsCard
          title="Total Collected"
          value={formatINR(stats.totalCollected)}
          icon={IndianRupee}
          color="green"
          subtitle="This month"
          trend={{ value: 12, label: "vs last month", positive: true }}
        />
        <StatsCard
          title="Pending Amount"
          value={formatINR(stats.totalPending)}
          icon={CreditCard}
          color="yellow"
          subtitle="Awaiting payment"
        />
        <StatsCard
          title="Open Complaints"
          value={stats.openComplaints}
          icon={MessageSquare}
          color={stats.openComplaints > 5 ? "red" : "blue"}
          subtitle="Need resolution"
        />
        <StatsCard
          title="Total Members"
          value={stats.totalMembers}
          icon={Users}
          color="purple"
          subtitle="Active residents"
        />
      </div>

      {/* ── CHARTS ROW ───────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Area Chart — Collection Trend */}
        <Card className="lg:col-span-2 card-hover">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">
                  Collection Trend
                </CardTitle>
                <CardDescription>Monthly billing vs target</CardDescription>
              </div>
              <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 border border-green-200 rounded-full px-2.5 py-1 font-medium">
                <TrendingUp className="h-3 w-3" />
                +12.5%
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={areaChartData}>
                <defs>
                  <linearGradient
                    id="collectedGrad"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="targetGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f0f0f0"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="target"
                  name="Target"
                  stroke="#3b82f6"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  fill="url(#targetGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="collected"
                  name="Collected"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fill="url(#collectedGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Expense Pie */}
        <Card className="card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Expenses</CardTitle>
            <CardDescription>By category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie
                  data={expensePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {expensePieData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.color}
                      stroke="white"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatINR(Number(v))} />
              </PieChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="space-y-1.5 mt-2">
              {expensePieData.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full flex-shrink-0"
                      style={{ background: item.color }}
                    />
                    <span className="text-zinc-600">{item.name}</span>
                  </div>
                  <span className="font-semibold text-zinc-800">
                    {formatINR(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── COMPLAINT CATEGORIES + RECENT ────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Bar Chart — Complaints by Category */}
        <Card className="card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Complaints by Category
            </CardTitle>
            <CardDescription>Distribution this month</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={complaintCategoryData} barSize={28}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f0f0f0"
                  horizontal={true}
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(v) => [v, "Complaints"]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e4e4e7",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" name="Count" radius={[6, 6, 0, 0]}>
                  {complaintCategoryData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Complaints Feed */}
        <Card className="card-hover">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">
                  Recent Complaints
                </CardTitle>
                <CardDescription>Latest issues raised</CardDescription>
              </div>
              <div className="flex items-center gap-1 text-xs text-red-600 font-medium">
                <Activity className="h-3.5 w-3.5" />
                {stats.openComplaints} open
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {recentComplaints.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mb-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-sm font-medium text-zinc-700">All clear!</p>
                <p className="text-xs text-muted-foreground mt-1">
                  No complaints at the moment
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentComplaints.map((complaint) => (
                  <div
                    key={complaint.id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-100 hover:bg-zinc-100 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-lg bg-white border flex items-center justify-center flex-shrink-0 shadow-sm">
                      <MessageSquare className="h-3.5 w-3.5 text-zinc-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-zinc-800">
                        {complaint.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {complaint.raised_by_user?.full_name}
                        </span>
                        <span className="text-zinc-300">•</span>
                        <span className="text-xs text-muted-foreground">
                          Flat{" "}
                          {complaint.raised_by_user?.flat?.flat_number ?? "N/A"}
                        </span>
                      </div>
                    </div>
                    <StatusBadge
                      status={complaint.priority}
                      type="complaint-priority"
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── RECENT BILLS TABLE ───────────────────────────── */}
      <Card className="card-hover">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">
                Recent Bills
              </CardTitle>
              <CardDescription>Latest maintenance bills</CardDescription>
            </div>
            {stats.overdueCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-full px-3 py-1">
                <AlertTriangle className="h-3 w-3" />
                {stats.overdueCount} overdue
              </div>
            )}
          </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recentBills.map((bill) => (
                <div
                  key={bill.id}
                  className="flex items-center gap-3 rounded-xl border p-3 hover:bg-zinc-50 transition-colors"
                >
                  <div
                    className={cn(
                      "h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0",
                      bill.status === "PAID"
                        ? "bg-green-100"
                        : bill.status === "OVERDUE"
                          ? "bg-red-100"
                          : "bg-amber-100",
                    )}
                  >
                    <CreditCard
                      className={cn(
                        "h-4 w-4",
                        bill.status === "PAID"
                          ? "text-green-600"
                          : bill.status === "OVERDUE"
                            ? "text-red-600"
                            : "text-amber-600",
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">
                      {bill.flat?.wing
                        ? `${bill.flat.wing}-${bill.flat.flat_number}`
                        : bill.flat?.flat_number || "N/A"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {bill.user?.full_name || "N/A"}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
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
  );
}
