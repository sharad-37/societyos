// src/app/(dashboard)/resident/bills/page.tsx
"use client";

import { useEffect, useState } from "react";
import {
  CreditCard,
  Download,
  IndianRupee,
  CheckCircle,
  Clock,
  AlertTriangle,
  Filter,
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
  flat: { flat_number: string; wing: string | null } | null;
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

export default function ResidentBillsPage() {
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

  useEffect(() => {
    fetchBills();
  }, [statusFilter, page]);

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
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayNow = (bill: Bill) => {
    const upiLink = `upi://pay?pa=society@upi&am=${Number(bill.total_amount)}&tn=${bill.bill_number}&cu=INR`;
    window.open(upiLink, "_blank");
    alert(
      `Pay ${formatINR(Number(bill.total_amount))} for ${bill.bill_number}\n\nShare payment screenshot with treasurer.`,
    );
  };

  const handleDownload = (bill: Bill) => {
    const text = `SOCIETYOS RECEIPT\nBill: ${bill.bill_number}\nAmount: ${formatINR(Number(bill.amount_paid))}\nStatus: PAID\nPaid: ${bill.paid_at ? formatDateShort(bill.paid_at) : "N/A"}`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt-${bill.bill_number}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
              +{formatINR(Number(b.late_fee))} late
            </p>
          )}
        </div>
      ),
    },
    {
      key: "due_date",
      label: "Due Date",
      render: (b: Bill) => {
        const d = getDaysUntilDue(b.due_date);
        return (
          <div>
            <p className="text-sm">{formatDateShort(b.due_date)}</p>
            {b.status === "PENDING" && d < 0 && (
              <p className="text-xs text-red-500">{Math.abs(d)}d overdue</p>
            )}
            {b.status === "PENDING" && d >= 0 && d <= 5 && (
              <p className="text-xs text-orange-500">{d}d left</p>
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
        <div className="flex gap-1">
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
              onClick={() => handleDownload(b)}
            >
              <Download className="h-3 w-3 mr-1" />
              Receipt
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Bills"
        description="View and pay maintenance bills"
        icon={CreditCard}
      />

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
          />
          <AppleStatsCard
            label="Pending"
            value={formatINR(stats.totalPending)}
            icon={Clock}
            iconColor="bg-amber-500"
          />
          <AppleStatsCard
            label="Overdue"
            value={formatINR(stats.totalOverdue)}
            icon={AlertTriangle}
            iconColor={stats.totalOverdue > 0 ? "bg-red-500" : "bg-green-500"}
            className="col-span-2 sm:col-span-1"
          />
        </div>
      )}

      <div className="apple-card overflow-hidden">
        <div className="p-5 pb-4 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-700/50">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
            All Bills
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
            emptyDescription="Bills will appear here once generated"
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
    </div>
  );
}
