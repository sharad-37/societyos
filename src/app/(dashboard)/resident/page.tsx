// src/app/(dashboard)/resident/page.tsx
"use client";

import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { StatsCard } from "@/components/shared/StatsCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { formatDateShort, formatINR, getDaysUntilDue } from "@/lib/utils";
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  Clock,
  CreditCard,
  IndianRupee,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

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

export default function ResidentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [billsRes, complaintsRes, noticesRes] = await Promise.all([
          fetch("/api/billing?limit=3&status=PENDING"),
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
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-zinc-950 p-6 text-white">
        <h2 className="text-xl font-bold">
          Good {getGreeting()}, {user?.fullName.split(" ")[0]}! 👋
        </h2>
        <p className="mt-1 text-zinc-400 text-sm">
          {user?.societyName} •{" "}
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatsCard
          title="Amount Due"
          value={formatINR(data?.stats.pendingAmount || 0)}
          icon={IndianRupee}
          color={data?.stats.pendingAmount ? "red" : "green"}
          subtitle={
            data?.stats.pendingAmount ? "Pay before due date" : "All clear!"
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
          title="Open Complaints"
          value={data?.stats.openComplaints || 0}
          icon={MessageSquare}
          color={data?.stats.openComplaints ? "yellow" : "green"}
          subtitle={
            data?.stats.openComplaints ? "Awaiting resolution" : "All resolved"
          }
        />
        <StatsCard
          title="New Notices"
          value={data?.stats.unreadNotices || 0}
          icon={Bell}
          color="default"
          subtitle="Recent"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pending Bills */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">
              Pending Bills
            </CardTitle>
            <Link href="/resident/bills">
              <Button variant="ghost" size="sm" className="text-xs">
                View all
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {data?.bills.length === 0 ? (
              <EmptyState
                icon={CheckCircle}
                title="All paid up!"
                description="You have no pending bills. Great job!"
                className="py-8"
              />
            ) : (
              data?.bills.map((bill) => {
                const daysLeft = getDaysUntilDue(bill.due_date);
                return (
                  <div
                    key={bill.id}
                    className="flex items-center justify-between rounded-xl border p-4 hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`rounded-lg p-2 ${daysLeft < 0 ? "bg-red-100" : "bg-yellow-100"}`}
                      >
                        <CreditCard
                          className={`h-4 w-4 ${daysLeft < 0 ? "text-red-600" : "text-yellow-600"}`}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {bill.bill_number}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Due: {formatDateShort(bill.due_date)}
                          {daysLeft < 0 && (
                            <span className="ml-1 text-red-500 font-medium">
                              ({Math.abs(daysLeft)} days overdue)
                            </span>
                          )}
                          {daysLeft >= 0 && daysLeft <= 5 && (
                            <span className="ml-1 text-yellow-600 font-medium">
                              ({daysLeft} days left)
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">
              My Complaints
            </CardTitle>
            <Link href="/resident/complaints">
              <Button variant="ghost" size="sm" className="text-xs">
                View all
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {data?.complaints.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="No complaints yet"
                description="Raise a complaint if you have any issues"
                className="py-8"
              />
            ) : (
              data?.complaints.map((complaint) => (
                <div
                  key={complaint.id}
                  className="flex items-start justify-between rounded-xl border p-4 hover:bg-zinc-50 transition-colors"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="rounded-lg bg-orange-100 p-2 flex-shrink-0">
                      <MessageSquare className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {complaint.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {complaint.complaint_number} •{" "}
                        {formatDateShort(complaint.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-2 flex-shrink-0">
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

        {/* Recent Notices */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">
              Latest Notices
            </CardTitle>
            <Link href="/resident/notices">
              <Button variant="ghost" size="sm" className="text-xs">
                View all
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {data?.notices.length === 0 ? (
              <EmptyState
                icon={Bell}
                title="No notices"
                description="Society notices will appear here"
                className="py-8"
              />
            ) : (
              <div className="space-y-3">
                {data?.notices.map((notice) => (
                  <div
                    key={notice.id}
                    className="flex items-start gap-4 rounded-xl border p-4 hover:bg-zinc-50 transition-colors"
                  >
                    <div
                      className={`rounded-lg p-2 flex-shrink-0 ${notice.is_urgent ? "bg-red-100" : "bg-blue-100"}`}
                    >
                      {notice.is_urgent ? (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      ) : (
                        <Bell className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {notice.title}
                        </p>
                        {notice.is_pinned && (
                          <span className="text-xs text-zinc-400">📌</span>
                        )}
                        {notice.is_urgent && (
                          <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                            Urgent
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {notice.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <Clock className="inline h-3 w-3 mr-1" />
                        {formatDateShort(notice.created_at)}
                      </p>
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

// Helper function
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}
