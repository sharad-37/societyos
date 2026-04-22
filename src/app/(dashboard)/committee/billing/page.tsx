// src/app/(dashboard)/committee/billing/page.tsx
"use client";

import { useEffect, useState } from "react";
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
  Users,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { StatsCard } from "@/components/shared/StatsCard";
import { Pagination } from "@/components/shared/Pagination";
import { formatINR, formatDateShort, getDaysUntilDue } from "@/lib/utils";

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
  flat: { flat_number: string; wing: string | null };
  user: { full_name: string; email: string };
  payments: any[];
}

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

export default function CommitteeBillingPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
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
    totalWaived: 0,
    paidCount: 0,
    pendingCount: 0,
    overdueCount: 0,
  });

  // Generate form state
  const [generateForm, setGenerateForm] = useState({
    month: String(currentMonth),
    year: String(currentYear),
    sendEmails: false,
  });

  useEffect(() => {
    fetchBills();
  }, [statusFilter, page]);

  const fetchBills = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "15",
        ...(statusFilter !== "ALL" && { status: statusFilter }),
      });

      const response = await fetch(`/api/billing?${params}`);
      const data = await response.json();

      if (data.success) {
        const allBills = data.data || [];
        setBills(allBills);
        setPagination({
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 1,
          hasNext: data.pagination?.hasNext || false,
          hasPrev: data.pagination?.hasPrev || false,
        });

        // Calculate stats
        setStats({
          totalCollected: allBills
            .filter((b: Bill) => b.status === "PAID")
            .reduce((s: number, b: Bill) => s + Number(b.amount_paid), 0),
          totalPending: allBills
            .filter((b: Bill) => b.status === "PENDING")
            .reduce((s: number, b: Bill) => s + Number(b.total_amount), 0),
          totalOverdue: allBills
            .filter((b: Bill) => b.status === "OVERDUE")
            .reduce((s: number, b: Bill) => s + Number(b.total_amount), 0),
          totalWaived: allBills
            .filter((b: Bill) => b.status === "WAIVED")
            .reduce((s: number, b: Bill) => s + Number(b.total_amount), 0),
          paidCount: allBills.filter((b: Bill) => b.status === "PAID").length,
          pendingCount: allBills.filter((b: Bill) => b.status === "PENDING")
            .length,
          overdueCount: allBills.filter((b: Bill) => b.status === "OVERDUE")
            .length,
        });
      }
    } catch (error) {
      console.error("Failed to fetch bills:", error);
    } finally {
      setIsLoading(false);
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
        fetchBills();
        setTimeout(() => {
          setShowGenerateModal(false);
          setGenerateSuccess("");
        }, 2000);
      } else {
        setGenerateError(data.message || "Failed to generate bills");
      }
    } catch {
      setGenerateError("Network error. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmPayment = async (billId: string) => {
    // Quick confirm payment
    try {
      const response = await fetch(`/api/billing/${billId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAID" }),
      });
      const data = await response.json();
      if (data.success) fetchBills();
    } catch (error) {
      console.error("Failed to confirm payment:", error);
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
              : bill.flat?.flat_number}
          </p>
          <p className="text-xs text-muted-foreground truncate max-w-[120px]">
            {bill.user?.full_name}
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
          {MONTHS[bill.billing_month - 1].slice(0, 3)} {bill.billing_year}
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
      label: "Action",
      render: (bill: Bill) => (
        <div className="flex items-center gap-1">
          {(bill.status === "PENDING" || bill.status === "OVERDUE") && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs text-green-700 border-green-200 hover:bg-green-50"
              onClick={() => handleConfirmPayment(bill.id)}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Mark Paid
            </Button>
          )}
        </div>
      ),
    },
  ];

  // Year options
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing Management"
        description="Generate and manage society maintenance bills"
        icon={CreditCard}
        action={
          <Button onClick={() => setShowGenerateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Generate Bills
          </Button>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatsCard
          title="Collected"
          value={formatINR(stats.totalCollected)}
          subtitle={`${stats.paidCount} bills paid`}
          icon={CheckCircle}
          color="green"
        />
        <StatsCard
          title="Pending"
          value={formatINR(stats.totalPending)}
          subtitle={`${stats.pendingCount} bills`}
          icon={Clock}
          color="yellow"
        />
        <StatsCard
          title="Overdue"
          value={formatINR(stats.totalOverdue)}
          subtitle={`${stats.overdueCount} bills`}
          icon={AlertTriangle}
          color={stats.overdueCount > 0 ? "red" : "green"}
        />
        <StatsCard
          title="Total Bills"
          value={pagination.total}
          subtitle="All time"
          icon={IndianRupee}
          color="blue"
        />
      </div>

      {/* Bills Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">All Bills</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchBills}
                className="h-8"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
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
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={bills}
            columns={columns}
            isLoading={isLoading}
            keyExtractor={(b) => b.id}
            emptyTitle="No bills found"
            emptyDescription="Generate bills for the current month to get started"
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
        </CardContent>
      </Card>

      {/* Generate Bills Modal */}
      <Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Monthly Bills</DialogTitle>
            <DialogDescription>
              This will create maintenance bills for all occupied flats
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Month + Year */}
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
                    {MONTHS.map((month, i) => (
                      <SelectItem key={month} value={String(i + 1)}>
                        {month}
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
                    {yearOptions.map((year) => (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Summary Box */}
            <div className="rounded-xl bg-zinc-50 border p-4 space-y-2">
              <p className="text-sm font-medium text-zinc-700">Bill Summary</p>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Period</span>
                  <span className="font-medium">
                    {MONTHS[parseInt(generateForm.month) - 1]}{" "}
                    {generateForm.year}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Due Date</span>
                  <span className="font-medium">
                    10th {MONTHS[parseInt(generateForm.month) - 1]}{" "}
                    {generateForm.year}
                  </span>
                </div>
              </div>
            </div>

            {/* Success/Error */}
            {generateSuccess && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <p className="text-sm text-green-700 font-medium">
                    {generateSuccess}
                  </p>
                </div>
              </div>
            )}

            {generateError && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-600">{generateError}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowGenerateModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleGenerateBills}
                disabled={isGenerating}
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
