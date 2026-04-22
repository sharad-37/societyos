// src/app/(dashboard)/resident/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  MessageSquare,
  Bell,
  AlertTriangle,
  CheckCircle,
  Clock,
  IndianRupee,
  ArrowRight,
  Vote,
  Users,
  Home,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatsCard } from "@/components/shared/StatsCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAuth } from "@/hooks/useAuth";
import { formatINR, formatDateShort, getDaysUntilDue } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface DashboardData {
  bills: any[];
  complaints: any[];
  notices: any[];
  stats: {
    pendingAmount: number;
    totalBills: number;
    openComplaints: number;
    unreadNotices: number;
  };
}

// Quick action items
const quickActions = [
  {
    label: "Pay Bills",
    href: "/resident/bills",
    icon: CreditCard,
    color: "bg-blue-500",
    description: "View & pay dues",
  },
  {
    label: "Raise Issue",
    href: "/resident/complaints",
    icon: MessageSquare,
    color: "bg-orange-500",
    description: "Report a problem",
  },
  {
    label: "Notices",
    href: "/resident/notices",
    icon: Bell,
    color: "bg-purple-500",
    description: "Society updates",
  },
  {
    label: "Vote Now",
    href: "/resident/polls",
    icon: Vote,
    color: "bg-green-500",
    description: "Active polls",
  },
  {
    label: "Add Visitor",
    href: "/resident/visitors",
    icon: Users,
    color: "bg-pink-500",
    description: "Guest OTP pass",
  },
];

export default function ResidentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [billsRes, complaintsRes, noticesRes] = await Promise.all([
          fetch("/api/billing?limit=4&status=PENDING"),
          fetch("/api/complaints?limit=3"),
          fetch("/api/notices?limit=3"),
        ]);

        const [billsData, complaintsData, noticesData] = await Promise.all([
          billsRes.json(),
          complaintsRes.json(),
          noticesRes.json(),
        ]);

        const bills = billsData.data || [];
        const complaints = complaintsData.data || [];
        const notices = noticesData.data || [];

        setData({
          bills,
          complaints,
          notices,
          stats: {
            pendingAmount: bills
              .filter(
                (b: any) => b.status === "PENDING" || b.status === "OVERDUE",
              )
              .reduce((sum: number, b: any) => sum + Number(b.total_amount), 0),
            totalBills: billsData.pagination?.total || 0,
            openComplaints: complaints.filter(
              (c: any) => c.status === "OPEN" || c.status === "IN_PROGRESS",
            ).length,
            unreadNotices: notices.length,
          },
        });
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 rounded-2xl bg-zinc-200" />
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-zinc-200" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-zinc-200" />
          ))}
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
      {/* ── WELCOME BANNER ───────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-zinc-950 p-5 text-white">
        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-20 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl" />

        <div className="relative">
          <p className="text-zinc-400 text-sm">
            {greeting()},{" "}
            <span className="text-white font-medium">
              {user?.fullName?.split(" ")[0]}
            </span>{" "}
            👋
          </p>
          <h1 className="text-xl font-bold mt-0.5">Welcome to SocietyOS</h1>
          <div className="flex items-center gap-2 mt-1">
            <Home className="h-3.5 w-3.5 text-zinc-500" />
            <p className="text-zinc-400 text-xs">{user?.societyName}</p>
          </div>

          {/* Alert if pending dues */}
          {data?.stats.pendingAmount && data.stats.pendingAmount > 0 ? (
            <div className="mt-3 flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
              <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0" />
              <p className="text-xs text-amber-300">
                You have{" "}
                <span className="font-bold">
                  {formatINR(data.stats.pendingAmount)}
                </span>{" "}
                in pending dues
              </p>
              <Link href="/resident/bills" className="ml-auto">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-[10px] border-amber-500/30 text-amber-300 hover:bg-amber-500/10 px-2"
                >
                  Pay Now
                </Button>
              </Link>
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2">
              <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
              <p className="text-xs text-green-300">
                All dues cleared! Great job 🎉
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── QUICK ACTIONS ────────────────────────────────── */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {quickActions.map((action) => (
          <Link key={action.href} href={action.href}>
            <div className="card-hover rounded-2xl border bg-white p-4 text-center cursor-pointer gradient-border">
              <div
                className={cn(
                  "h-10 w-10 rounded-xl mx-auto mb-3 flex items-center justify-center",
                  action.color,
                )}
              >
                <action.icon className="h-5 w-5 text-white" />
              </div>
              <p className="text-xs font-semibold text-zinc-800 leading-tight">
                {action.label}
              </p>
              <p className="text-[10px] text-zinc-400 mt-0.5 hidden sm:block">
                {action.description}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* ── STATS ROW ────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatsCard
          title="Amount Due"
          value={formatINR(data?.stats.pendingAmount || 0)}
          icon={IndianRupee}
          color={data?.stats.pendingAmount ? "red" : "green"}
          subtitle={
            data?.stats.pendingAmount
              ? "Pay before due date"
              : "All paid up! ✅"
          }
        />
        <StatsCard
          title="Total Bills"
          value={data?.stats.totalBills || 0}
          icon={CreditCard}
          color="blue"
          subtitle="This year"
        />
        <StatsCard
          title="My Complaints"
          value={data?.stats.openComplaints || 0}
          icon={MessageSquare}
          color={data?.stats.openComplaints ? "yellow" : "green"}
          subtitle={data?.stats.openComplaints ? "In progress" : "All resolved"}
        />
        <StatsCard
          title="New Notices"
          value={data?.stats.unreadNotices || 0}
          icon={Bell}
          color="purple"
          subtitle="Unread"
        />
      </div>

      {/* ── BILLS + COMPLAINTS ───────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pending Bills */}
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">
              Pending Bills
            </CardTitle>
            <Link href="/resident/bills">
              <Button variant="ghost" size="sm" className="text-xs h-7 gap-1">
                View all
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {!data?.bills.length ? (
              <EmptyState
                icon={CheckCircle}
                title="All paid up!"
                description="No pending bills"
                className="py-6"
              />
            ) : (
              data?.bills.map((bill) => {
                const daysLeft = getDaysUntilDue(bill.due_date);
                const isOverdue = daysLeft < 0;
                const isDueSoon = daysLeft >= 0 && daysLeft <= 5;

                return (
                  <div
                    key={bill.id}
                    className={cn(
                      "flex items-center justify-between",
                      "rounded-xl border p-3.5",
                      "hover:bg-zinc-50 transition-colors",
                      isOverdue && "border-red-200 bg-red-50/30",
                      isDueSoon &&
                        !isOverdue &&
                        "border-amber-200 bg-amber-50/30",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "rounded-lg p-2",
                          isOverdue
                            ? "bg-red-100"
                            : isDueSoon
                              ? "bg-amber-100"
                              : "bg-zinc-100",
                        )}
                      >
                        <CreditCard
                          className={cn(
                            "h-4 w-4",
                            isOverdue
                              ? "text-red-600"
                              : isDueSoon
                                ? "text-amber-600"
                                : "text-zinc-600",
                          )}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">
                          {bill.bill_number}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Due: {formatDateShort(bill.due_date)}
                          {isOverdue && (
                            <span className="ml-1 text-red-500 font-medium">
                              ({Math.abs(daysLeft)}d overdue)
                            </span>
                          )}
                          {isDueSoon && !isOverdue && (
                            <span className="ml-1 text-amber-600 font-medium">
                              ({daysLeft}d left)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">
                        {formatINR(Number(bill.total_amount))}
                      </p>
                      <StatusBadge status={bill.status} type="bill" />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Recent Complaints */}
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">
              My Complaints
            </CardTitle>
            <Link href="/resident/complaints">
              <Button variant="ghost" size="sm" className="text-xs h-7 gap-1">
                View all
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {!data?.complaints.length ? (
              <EmptyState
                icon={MessageSquare}
                title="No complaints"
                description="All is well in your society!"
                className="py-6"
              />
            ) : (
              data?.complaints.map((complaint) => (
                <div
                  key={complaint.id}
                  className="flex items-start gap-3 rounded-xl border p-3.5 hover:bg-zinc-50 transition-colors"
                >
                  <div className="rounded-lg bg-orange-100 p-2 flex-shrink-0">
                    <MessageSquare className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {complaint.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {complaint.complaint_number} •{" "}
                      {formatDateShort(complaint.created_at)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <StatusBadge
                      status={complaint.status}
                      type="complaint-status"
                    />
                    <StatusBadge
                      status={complaint.priority}
                      type="complaint-priority"
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── NOTICES ──────────────────────────────────────── */}
      {data?.notices && data.notices.length > 0 && (
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">
              Latest Notices
            </CardTitle>
            <Link href="/resident/notices">
              <Button variant="ghost" size="sm" className="text-xs h-7 gap-1">
                View all
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {data.notices.map((notice) => (
                <div
                  key={notice.id}
                  className={cn(
                    "rounded-xl border p-4",
                    "hover:shadow-sm transition-shadow",
                    notice.is_urgent
                      ? "border-red-200 bg-red-50"
                      : "bg-zinc-50",
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {notice.is_urgent ? (
                      <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                    ) : (
                      <Bell className="h-4 w-4 text-zinc-500 flex-shrink-0" />
                    )}
                    <p className="text-xs font-semibold text-zinc-800 truncate">
                      {notice.title}
                    </p>
                  </div>
                  <p className="text-xs text-zinc-500 line-clamp-2">
                    {notice.content}
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-2">
                    {formatDateShort(notice.created_at)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
