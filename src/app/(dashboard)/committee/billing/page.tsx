// src/app/(dashboard)/committee/billing/page.tsx
"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  CreditCard,
  Plus,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertTriangle,
  IndianRupee,
  Download,
  Filter,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Pagination } from "@/components/shared/Pagination";
import {
  AppleStatsCard,
  AppleCardSkeleton,
} from "@/components/ui/apple-components";
import { formatINR, formatDateShort, getDaysUntilDue } from "@/lib/utils";
import { generateBillingReport } from "@/lib/pdf";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────
interface Bill {
  id: string;
  bill_number: string;
  billing_month: number;
  billing_year: number;
  amount: string;
  late_fee: string;
  total_amount: string;
  amount_paid: string;
  status: string;
  due_date: string;
  paid_at: string | null;
  flat: { flat_number: string; wing: string | null } | null;
  user: { full_name: string; email: string } | null;
  payments: any[];
}

// ─── Constants ────────────────────────────────────────────────
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

// ─── Component ────────────────────────────────────────────────
export default function CommitteeBillingPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [generateSuccess, setGenerateSuccess] = useState("");
  const [generateError, setGenerateError] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [stats, setStats] = useState({
    totalCollected: 0,
    totalPending: 0,
    totalOverdue: 0,
    paidCount: 0,
    pendingCount: 0,
    overdueCount: 0,
  });
  const [generateForm, setGenerateForm] = useState({
    month: String(currentMonth),
    year: String(currentYear),
    sendEmails: false,
  });

  useEffect(() => {
    fetchBills();
  }, [statusFilter, page]);

  const fetchBills = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "15",
        ...(statusFilter !== "ALL" && { status: statusFilter }),
      });

      const response = await fetch(`/api/billing?${params}`);
      const data = await response.json();

      if (data.success) {
        const allBills: Bill[] = data.data || [];
        setBills(allBills);
        setPagination({
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 1,
          hasNext: data.pagination?.hasNext || false,
          hasPrev: data.pagination?.hasPrev || false,
        });
        setStats({
          totalCollected: allBills
            .filter((b) => b.status === "PAID")
            .reduce((s, b) => s + Number(b.amount_paid), 0),
          totalPending: allBills
            .filter((b) => b.status === "PENDING")
            .reduce((s, b) => s + Number(b.total_amount), 0),
          totalOverdue: allBills
            .filter((b) => b.status === "OVERDUE")
            .reduce((s, b) => s + Number(b.total_amount), 0),
          paidCount: allBills.filter((b) => b.status === "PAID").length,
          pendingCount: allBills.filter((b) => b.status === "PENDING").length,
          overdueCount: allBills.filter((b) => b.status === "OVERDUE").length,
        });
      }
    } catch (error) {
      toast.error("Failed to fetch bills");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleGenerateBills = async () => {
    setIsGenerating(true);
    setGenerateError("");
    setGenerateSuccess("");

    try {
      const response = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: parseInt(generateForm.month),
          year: parseInt(generateForm.year),
          sendEmails: generateForm.sendEmails,
        }),
      });
      const data = await response.json();

      if (data.success) {
        setGenerateSuccess(data.message);
        toast.success(data.message);
        fetchBills();
        setTimeout(() => {
          setShowGenerateModal(false);
          setGenerateSuccess("");
        }, 2000);
      } else {
        setGenerateError(data.message || "Failed to generate bills");
        toast.error(data.message);
      }
    } catch {
      setGenerateError("Network error. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMarkPaid = async (billId: string) => {
    try {
      const res = await fetch(`/api/billing/${billId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAID" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Bill marked as paid ✅");
        fetchBills();
      } else {
        toast.error(data.message || "Failed to update");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const handleMarkOverdue = async (billId: string) => {
    try {
      const res = await fetch(`/api/billing/${billId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "OVERDUE" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Bill marked as overdue");
        fetchBills();
      } else {
        toast.error(data.message || "Failed to update");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const handleExportPDF = async () => {
    if (bills.length === 0) {
      toast.error("No bills to export");
      return;
    }
    setIsExporting(true);
    try {
      await generateBillingReport({
        societyName: "Sunshine Apartments CHS",
        month: MONTHS[parseInt(generateForm.month) - 1],
        year: parseInt(generateForm.year),
        bills: bills.map((bill) => ({
          flat_number: bill.flat?.wing
            ? `${bill.flat.wing}-${bill.flat.flat_number}`
            : bill.flat?.flat_number || "N/A",
          resident_name: bill.user?.full_name || "N/A",
          amount: Number(bill.total_amount),
          status: bill.status,
          due_date: bill.due_date,
          paid_at: bill.paid_at,
        })),
      });
      toast.success("PDF downloaded! 📄");
    } catch {
      toast.error("Failed to generate PDF");
    } finally {
      setIsExporting(false);
    }
  };

  const columns = [
    {
      key: "flat",
      label: "Flat",
      render: (bill: Bill) => (
        <div>
          <p className="font-semibold text-sm">
            {bill.flat?.wing
              ? `${bill.flat.wing}-${bill.flat.flat_number}`
              : bill.flat?.flat_number || "N/A"}
          </p>
          <p className="text-xs text-muted-foreground truncate max-w-[120px]">
            {bill.user?.full_name || "N/A"}
          </p>
        </div>
      ),
    },
    {
      key: "bill_number",
      label: "Bill No.",
      render: (bill: Bill) => (
        <span className="font-mono text-xs text-muted-foreground">
          {bill.bill_number}
        </span>
      ),
    },
    {
      key: "period",
      label: "Period",
      render: (bill: Bill) => (
        <span className="text-sm">
          {MONTHS[bill.billing_month - 1]?.slice(0, 3)} {bill.billing_year}
        </span>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      render: (bill: Bill) => (
        <div>
          <p className="font-semibold text-sm">
            {formatINR(Number(bill.total_amount))}
          </p>
          {Number(bill.late_fee) > 0 && (
            <p className="text-xs text-red-500">
              +{formatINR(Number(bill.late_fee))} late
            </p>
          )}
        </div>
      ),
    },
    {
      key: "due_date",
      label: "Due Date",
      render: (bill: Bill) => {
        const daysLeft = getDaysUntilDue(bill.due_date);
        return (
          <div>
            <p className="text-sm">{formatDateShort(bill.due_date)}</p>
            {bill.status === "PENDING" && daysLeft < 0 && (
              <p className="text-xs text-red-500 font-medium">
                {Math.abs(daysLeft)}d overdue
              </p>
            )}
            {bill.status === "PAID" && bill.paid_at && (
              <p className="text-xs text-green-600">
                Paid {formatDateShort(bill.paid_at)}
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      render: (bill: Bill) => <StatusBadge status={bill.status} type="bill" />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (bill: Bill) => (
        <div className="flex items-center gap-1">
          {(bill.status === "PENDING" ||
            bill.status === "OVERDUE" ||
            bill.status === "PARTIALLY_PAID") && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs text-green-700 border-green-200 hover:bg-green-50"
              onClick={() => handleMarkPaid(bill.id)}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Paid
            </Button>
          )}
          {bill.status === "PENDING" && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => handleMarkOverdue(bill.id)}
            >
              <AlertTriangle className="h-3 w-3" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Billing Management"
        description="Generate and manage maintenance bills"
        icon={CreditCard}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              disabled={bills.length === 0 || isExporting}
            >
              {isExporting ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export PDF
            </Button>
            <Button size="sm" onClick={() => setShowGenerateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Generate Bills
            </Button>
          </div>
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
            label="Collected"
            value={formatINR(stats.totalCollected)}
            sublabel={`${stats.paidCount} paid`}
            icon={CheckCircle}
            iconColor="bg-green-500"
          />
          <AppleStatsCard
            label="Pending"
            value={formatINR(stats.totalPending)}
            sublabel={`${stats.pendingCount} bills`}
            icon={Clock}
            iconColor="bg-amber-500"
          />
          <AppleStatsCard
            label="Overdue"
            value={formatINR(stats.totalOverdue)}
            sublabel={`${stats.overdueCount} bills`}
            icon={AlertTriangle}
            iconColor={stats.overdueCount > 0 ? "bg-red-500" : "bg-green-500"}
          />
          <AppleStatsCard
            label="Total Bills"
            value={pagination.total}
            sublabel="All records"
            icon={IndianRupee}
            iconColor="bg-blue-500"
          />
        </div>
      )}

      {/* Collection Rate Bar */}
      {!isLoading && pagination.total > 0 && (
        <div className="apple-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Collection Rate
            </p>
            <p className="text-sm font-bold text-zinc-900 dark:text-white">
              {stats.totalCollected + stats.totalPending + stats.totalOverdue >
              0
                ? Math.round(
                    (stats.totalCollected /
                      (stats.totalCollected +
                        stats.totalPending +
                        stats.totalOverdue)) *
                      100,
                  )
                : 0}
              %
            </p>
          </div>
          <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-700"
              style={{
                width: `${
                  stats.totalCollected +
                    stats.totalPending +
                    stats.totalOverdue >
                  0
                    ? Math.round(
                        (stats.totalCollected /
                          (stats.totalCollected +
                            stats.totalPending +
                            stats.totalOverdue)) *
                          100,
                      )
                    : 0
                }%`,
              }}
            />
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />
              Collected: {formatINR(stats.totalCollected)}
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-400 inline-block" />
              Pending: {formatINR(stats.totalPending)}
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-400 inline-block" />
              Overdue: {formatINR(stats.totalOverdue)}
            </span>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="apple-card overflow-hidden">
        <div className="p-5 pb-4 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-700/50">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
              All Bills
              {pagination.total > 0 && (
                <span className="ml-2 text-xs font-normal text-zinc-400">
                  ({pagination.total} total)
                </span>
              )}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchBills(true)}
              disabled={isRefreshing}
              className="h-8"
            >
              <RefreshCw
                className={cn("h-3 w-3 mr-1", isRefreshing && "animate-spin")}
              />
              Refresh
            </Button>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-36 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
                <SelectItem value="PARTIALLY_PAID">Partial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="p-5">
          <DataTable
            data={bills}
            columns={columns}
            isLoading={isLoading}
            keyExtractor={(b) => b.id}
            emptyTitle="No bills found"
            emptyDescription={
              statusFilter !== "ALL"
                ? `No ${statusFilter.toLowerCase()} bills`
                : "Generate bills to get started"
            }
          />
          <Pagination
            page={page}
            totalPages={pagination.totalPages}
            hasNext={pagination.hasNext}
            hasPrev={pagination.hasPrev}
            onNext={() => setPage(page + 1)}
            onPrev={() => setPage(page - 1)}
            total={pagination.total}
            limit={15}
          />
        </div>
      </div>

      {/* Generate Modal */}
      <Dialog
        open={showGenerateModal}
        onOpenChange={(open) => {
          setShowGenerateModal(open);
          if (!open) {
            setGenerateError("");
            setGenerateSuccess("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Monthly Bills</DialogTitle>
            <DialogDescription>
              Creates bills for all occupied flats
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Month</Label>
                <Select
                  value={generateForm.month}
                  onValueChange={(v) =>
                    setGenerateForm({ ...generateForm, month: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m, i) => (
                      <SelectItem key={m} value={String(i + 1)}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Select
                  value={generateForm.year}
                  onValueChange={(v) =>
                    setGenerateForm({ ...generateForm, year: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-4 space-y-2">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Preview
              </p>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Period</span>
                  <span className="font-medium">
                    {MONTHS[parseInt(generateForm.month) - 1]}{" "}
                    {generateForm.year}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Due Date</span>
                  <span className="font-medium">
                    10th {MONTHS[parseInt(generateForm.month) - 1]}{" "}
                    {generateForm.year}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Bills can only be generated once per month period.
                </p>
              </div>
            </div>

            {generateSuccess && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-700 font-medium">
                  {generateSuccess}
                </p>
              </div>
            )}

            {generateError && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-600">{generateError}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowGenerateModal(false)}
                disabled={isGenerating}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleGenerateBills}
                disabled={isGenerating || !!generateSuccess}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Generate Bills
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
