// src/app/(dashboard)/resident/bills/page.tsx
"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  CreditCard,
  Download,
  IndianRupee,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Pagination } from "@/components/shared/Pagination";
import {
  AppleStatsCard,
  AppleCardSkeleton,
} from "@/components/ui/apple-components";
import { PaymentModal } from "@/components/billing/PaymentModal";
import { generateReceiptPDF } from "@/lib/receipt-pdf";
import { formatINR, formatDateShort, getDaysUntilDue } from "@/lib/utils";

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
  payments: {
    id: string;
    payment_method: string;
    transaction_id: string | null;
    upi_ref_number: string | null;
    payment_status: string;
  }[];
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

// ─── Component ────────────────────────────────────────────────
export default function ResidentBillsPage() {
  // ── State ──────────────────────────────────────────────────
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [stats, setStats] = useState({
    totalPaid: 0,
    totalPending: 0,
    totalOverdue: 0,
  });

  // Payment modal state
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  // ── Effects ────────────────────────────────────────────────
  useEffect(() => {
    fetchBills();
  }, [statusFilter, page]);

  // ── Fetch ──────────────────────────────────────────────────
  const fetchBills = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
        ...(statusFilter !== "ALL" && { status: statusFilter }),
      });

      const res = await fetch(`/api/billing?${params}`);
      const data = await res.json();

      if (data.success) {
        const all: Bill[] = data.data || [];
        setBills(all);
        setPagination({
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 1,
          hasNext: data.pagination?.hasNext || false,
          hasPrev: data.pagination?.hasPrev || false,
        });
        setStats({
          totalPaid: all
            .filter((b) => b.status === "PAID")
            .reduce((s, b) => s + Number(b.total_amount), 0),
          totalPending: all
            .filter((b) => b.status === "PENDING")
            .reduce((s, b) => s + Number(b.total_amount), 0),
          totalOverdue: all
            .filter((b) => b.status === "OVERDUE")
            .reduce((s, b) => s + Number(b.total_amount), 0),
        });
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load bills");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Handlers ───────────────────────────────────────────────
  const handlePayNow = (bill: Bill) => {
    setSelectedBill(bill);
    setShowPayModal(true);
  };

  const handleDownloadReceipt = async (bill: Bill) => {
    try {
      const receiptNumber = `RCP-${bill.billing_year}-${String(
        bill.billing_month,
      ).padStart(2, "0")}-${bill.id.slice(0, 6).toUpperCase()}`;

      const confirmedPayment = bill.payments?.find(
        (p) => p.payment_status === "CONFIRMED",
      );

      await generateReceiptPDF({
        receiptNumber,
        billNumber: bill.bill_number,
        residentName: "Resident",
        flatNumber: bill.flat?.wing
          ? `${bill.flat.wing}-${bill.flat.flat_number}`
          : bill.flat?.flat_number || "N/A",
        societyName: "Sunshine Apartments CHS",
        billingMonth: MONTHS[bill.billing_month - 1],
        billingYear: bill.billing_year,
        amount: Number(bill.amount),
        lateFee: Number(bill.late_fee),
        totalAmount: Number(bill.total_amount),
        paymentMethod: confirmedPayment?.payment_method || "UPI",
        paymentDate: bill.paid_at || new Date().toISOString(),
        transactionId: confirmedPayment?.transaction_id || undefined,
        upiRefNumber: confirmedPayment?.upi_ref_number || undefined,
        status: bill.status,
      });

      toast.success("PDF receipt downloaded! 📄");
    } catch (error) {
      console.error("PDF error:", error);
      toast.error("Failed to generate PDF");
    }
  };

  // ── Table Columns ──────────────────────────────────────────
  const columns = [
    {
      key: "bill_number",
      label: "Bill No.",
      render: (b: Bill) => (
        <span className="font-mono text-xs text-muted-foreground">
          {b.bill_number}
        </span>
      ),
    },
    {
      key: "period",
      label: "Period",
      render: (b: Bill) => (
        <span className="text-sm">
          {MONTHS[b.billing_month - 1]} {b.billing_year}
        </span>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      render: (b: Bill) => (
        <div>
          <p className="font-semibold text-sm">
            {formatINR(Number(b.total_amount))}
          </p>
          {Number(b.late_fee) > 0 && (
            <p className="text-xs text-red-500">
              +{formatINR(Number(b.late_fee))} late fee
            </p>
          )}
        </div>
      ),
    },
    {
      key: "due_date",
      label: "Due Date",
      render: (b: Bill) => {
        const daysLeft = getDaysUntilDue(b.due_date);
        const isOverdue = daysLeft < 0;
        const isDueSoon = daysLeft >= 0 && daysLeft <= 5;

        return (
          <div>
            <p className="text-sm">{formatDateShort(b.due_date)}</p>
            {b.status === "PENDING" && isOverdue && (
              <p className="text-xs text-red-500 font-medium">
                {Math.abs(daysLeft)}d overdue
              </p>
            )}
            {b.status === "PENDING" && isDueSoon && !isOverdue && (
              <p className="text-xs text-amber-500 font-medium">
                {daysLeft}d left
              </p>
            )}
            {b.status === "PAID" && b.paid_at && (
              <p className="text-xs text-green-600">
                Paid {formatDateShort(b.paid_at)}
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      render: (b: Bill) => <StatusBadge status={b.status} type="bill" />,
    },
    {
      key: "actions",
      label: "Action",
      render: (b: Bill) => (
        <div className="flex items-center gap-2">
          {(b.status === "PENDING" || b.status === "OVERDUE") && (
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={() => handlePayNow(b)}
            >
              Pay Now
            </Button>
          )}
          {b.status === "PAID" && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => handleDownloadReceipt(b)}
            >
              <Download className="h-3 w-3 mr-1" />
              Receipt
            </Button>
          )}
        </div>
      ),
    },
  ];

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="My Bills"
        description="View and pay your maintenance bills"
        icon={CreditCard}
      />

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <AppleCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <AppleStatsCard
            label="Paid"
            value={formatINR(stats.totalPaid)}
            icon={CheckCircle}
            iconColor="bg-green-500"
            sublabel="Cleared"
          />
          <AppleStatsCard
            label="Pending"
            value={formatINR(stats.totalPending)}
            icon={Clock}
            iconColor="bg-amber-500"
            sublabel="Due soon"
          />
          <AppleStatsCard
            label="Overdue"
            value={formatINR(stats.totalOverdue)}
            icon={AlertTriangle}
            iconColor={stats.totalOverdue > 0 ? "bg-red-500" : "bg-green-500"}
            sublabel={stats.totalOverdue > 0 ? "Pay immediately" : "All clear!"}
            className="col-span-2 sm:col-span-1"
          />
        </div>
      )}

      {/* Bills Table */}
      <div className="apple-card overflow-hidden">
        <div className="p-5 pb-4 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-700/50">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
            All Bills
            {pagination.total > 0 && (
              <span className="ml-2 text-xs font-normal text-zinc-400">
                ({pagination.total} total)
              </span>
            )}
          </h3>
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

        <div className="p-5">
          <DataTable
            data={bills}
            columns={columns}
            isLoading={isLoading}
            keyExtractor={(b) => b.id}
            emptyTitle="No bills found"
            emptyDescription="Your bills will appear here once generated"
          />
          <Pagination
            page={page}
            totalPages={pagination.totalPages}
            hasNext={pagination.hasNext}
            hasPrev={pagination.hasPrev}
            onNext={() => setPage(page + 1)}
            onPrev={() => setPage(page - 1)}
            total={pagination.total}
            limit={10}
          />
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        bill={selectedBill}
        open={showPayModal}
        onClose={() => {
          setShowPayModal(false);
          setSelectedBill(null);
        }}
        onSuccess={() => {
          fetchBills();
          setShowPayModal(false);
          setSelectedBill(null);
        }}
      />
    </div>
  );
}
