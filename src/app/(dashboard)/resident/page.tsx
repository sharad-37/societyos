// src/app/(dashboard)/resident/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  MessageSquare,
  Bell,
  Vote,
  Users,
  IndianRupee,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import {
  AppleStatsCard,
  AppleListItem,
  AppleSection,
  AppleBadge,
  AppleEmptyState,
  AppleCardSkeleton,
} from "@/components/ui/apple-components";
import { useAuth } from "@/hooks/useAuth";
import { formatINR, formatDateShort, getDaysUntilDue } from "@/lib/utils";
import { cn } from "@/lib/utils";

const quickActions = [
  {
    label: "Pay Bill",
    href: "/resident/bills",
    icon: CreditCard,
    color: "bg-blue-500",
  },
  {
    label: "Report",
    href: "/resident/complaints",
    icon: MessageSquare,
    color: "bg-orange-500",
  },
  {
    label: "Notices",
    href: "/resident/notices",
    icon: Bell,
    color: "bg-purple-500",
  },
  { label: "Vote", href: "/resident/polls", icon: Vote, color: "bg-green-500" },
  {
    label: "Visitor",
    href: "/resident/visitors",
    icon: Users,
    color: "bg-pink-500",
  },
];

export default function ResidentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [bRes, cRes, nRes] = await Promise.all([
          fetch("/api/billing?limit=3&status=PENDING"),
          fetch("/api/complaints?limit=3"),
          fetch("/api/notices?limit=2"),
        ]);
        const [bData, cData, nData] = await Promise.all([
          bRes.json(),
          cRes.json(),
          nRes.json(),
        ]);
        const bills = bData.data || [];
        const complaints = cData.data || [];
        const notices = nData.data || [];
        setData({
          bills,
          complaints,
          notices,
          pendingAmount: bills
            .filter((b: any) => ["PENDING", "OVERDUE"].includes(b.status))
            .reduce((s: number, b: any) => s + Number(b.total_amount), 0),
          totalBills: bData.pagination?.total || 0,
          openComplaints: complaints.filter((c: any) =>
            ["OPEN", "IN_PROGRESS"].includes(c.status),
          ).length,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="space-y-1">
        <p className="text-sm text-zinc-400 font-medium">{greeting()} 👋</p>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          {user?.fullName?.split(" ")[0] || "Resident"}
        </h1>
        <p className="text-sm text-zinc-400">{user?.societyName}</p>
      </div>

      {/* Alert */}
      {!isLoading &&
        (data?.pendingAmount > 0 ? (
          <Link href="/resident/bills">
            <div className="apple-card p-4 flex items-center gap-4 bg-orange-50 dark:bg-orange-900/20 cursor-pointer group">
              <div className="h-10 w-10 rounded-2xl bg-orange-500 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">
                  Payment Due
                </p>
                <p className="text-xs text-orange-600 mt-0.5">
                  {formatINR(data.pendingAmount)} pending
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-orange-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ) : (
          <div className="apple-card p-4 flex items-center gap-4 bg-green-50 dark:bg-green-900/20">
            <div className="h-10 w-10 rounded-2xl bg-green-500 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                All Clear!
              </p>
              <p className="text-xs text-green-600 mt-0.5">
                No pending dues 🎉
              </p>
            </div>
          </div>
        ))}

      {/* Quick Actions */}
      <div className="grid grid-cols-5 gap-2.5">
        {quickActions.map((action) => (
          <Link key={action.href} href={action.href}>
            <div className="apple-card p-3 flex flex-col items-center gap-2 text-center cursor-pointer">
              <div
                className={cn(
                  "h-11 w-11 rounded-2xl flex items-center justify-center",
                  action.color,
                )}
              >
                <action.icon className="h-5 w-5 text-white" />
              </div>
              <p className="text-xs font-semibold text-zinc-900 dark:text-white leading-tight">
                {action.label}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <AppleCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <AppleStatsCard
            label="Amount Due"
            value={formatINR(data?.pendingAmount || 0)}
            sublabel="Maintenance"
            icon={IndianRupee}
            iconColor={
              data?.pendingAmount > 0 ? "bg-orange-500" : "bg-green-500"
            }
          />
          <AppleStatsCard
            label="My Bills"
            value={data?.totalBills || 0}
            sublabel="This year"
            icon={CreditCard}
            iconColor="bg-blue-500"
          />
          <AppleStatsCard
            label="Open Issues"
            value={data?.openComplaints || 0}
            sublabel="Complaints"
            icon={MessageSquare}
            iconColor={
              data?.openComplaints > 0 ? "bg-orange-500" : "bg-green-500"
            }
            className="col-span-2 sm:col-span-1"
          />
        </div>
      )}

      {/* Bills */}
      <AppleSection
        title="Pending Bills"
        action={
          <Link href="/resident/bills" className="flex items-center gap-1">
            See all <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        }
      >
        {isLoading ? (
          <div className="p-4">
            <div className="skeleton h-14 rounded-xl" />
          </div>
        ) : !data?.bills?.length ? (
          <AppleEmptyState
            icon={CheckCircle}
            title="No pending bills"
            description="You're all caught up"
          />
        ) : (
          data.bills.map((bill: any) => {
            const daysLeft = getDaysUntilDue(bill.due_date);
            const isOverdue = daysLeft < 0;
            return (
              <AppleListItem
                key={bill.id}
                icon={CreditCard}
                iconColor={
                  isOverdue
                    ? "bg-red-500"
                    : daysLeft <= 5
                      ? "bg-orange-500"
                      : "bg-blue-500"
                }
                title={bill.bill_number}
                subtitle={`Due ${formatDateShort(bill.due_date)}${isOverdue ? ` · ${Math.abs(daysLeft)}d overdue` : ""}`}
                right={
                  <div className="text-right">
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">
                      {formatINR(Number(bill.total_amount))}
                    </p>
                    <AppleBadge color={isOverdue ? "red" : "blue"} dot>
                      {bill.status}
                    </AppleBadge>
                  </div>
                }
                showChevron
              />
            );
          })
        )}
      </AppleSection>

      {/* Complaints */}
      <AppleSection
        title="Recent Issues"
        action={
          <Link href="/resident/complaints" className="flex items-center gap-1">
            See all <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        }
      >
        {isLoading ? (
          <div className="p-4">
            <div className="skeleton h-14 rounded-xl" />
          </div>
        ) : !data?.complaints?.length ? (
          <AppleEmptyState
            icon={MessageSquare}
            title="No complaints"
            description="All is well!"
          />
        ) : (
          data.complaints.map((c: any) => (
            <AppleListItem
              key={c.id}
              icon={MessageSquare}
              iconColor={
                c.priority === "URGENT"
                  ? "bg-red-500"
                  : c.priority === "HIGH"
                    ? "bg-orange-500"
                    : "bg-blue-500"
              }
              title={c.title}
              subtitle={`${c.complaint_number} · ${formatDateShort(c.created_at)}`}
              right={
                <AppleBadge
                  color={
                    c.status === "RESOLVED"
                      ? "green"
                      : c.status === "OPEN"
                        ? "red"
                        : "orange"
                  }
                  dot
                >
                  {c.status}
                </AppleBadge>
              }
              showChevron
            />
          ))
        )}
      </AppleSection>
    </div>
  );
}
