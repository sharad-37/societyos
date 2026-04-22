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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  flat: { flat_number: string; wing: string };
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

  // Stats
  const [stats, setStats] = useState({
    totalPaid: 0,
    totalPending: 0,
    totalOverdue: 0,
    totalAmount: 0,
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

      const response = await fetch(`/api/billing?${params}`);
      const data = await response.json();

      if (data.success) {
        setBills(data.data || []);
        setPagination({
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 1,
          hasNext: data.pagination?.hasNext || false,
          hasPrev: data.pagination?.hasPrev || false,
        });

        // Calculate stats from all bills
        const allBills = data.data || [];
        setStats({
          totalPaid: allBills
            .filter((b: Bill) => b.status === "PAID")
            .reduce((sum: number, b: Bill) => sum + Number(b.total_amount), 0),
          totalPending: allBills
            .filter((b: Bill) => b.status === "PENDING")
            .reduce((sum: number, b: Bill) => sum + Number(b.total_amount), 0),
          totalOverdue: allBills
            .filter((b: Bill) => b.status === "OVERDUE")
            .reduce((sum: number, b: Bill) => sum + Number(b.total_amount), 0),
          totalAmount: allBills.reduce(
            (sum: number, b: Bill) => sum + Number(b.total_amount),
            0,
          ),
        });
      }
    } catch (error) {
      console.error("Failed to fetch bills:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    {
      key: "bill_number",
      label: "Bill No.",
      render: (bill: Bill) => (
        <span className="font-mono text-sm font-medium">
          {bill.bill_number}
        </span>
      ),
    },
    {
      key: "period",
      label: "Period",
      render: (bill: Bill) => (
        <span className="text-sm">
          {MONTHS[bill.billing_month - 1]} {bill.billing_year}
        </span>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      render: (bill: Bill) => (
        <div>
          <p className="font-semibold">
            {formatINR(Number(bill.total_amount))}
          </p>
          {Number(bill.late_fee) > 0 && (
            <p className="text-xs text-red-500">
              +{formatINR(Number(bill.late_fee))} late fee
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
            {bill.status === "PENDING" && (
              <p
                className={`text-xs font-medium ${
                  daysLeft < 0
                    ? "text-red-500"
                    : daysLeft <= 5
                      ? "text-yellow-600"
                      : "text-green-600"
                }`}
              >
                {daysLeft < 0
                  ? `${Math.abs(daysLeft)} days overdue`
                  : daysLeft === 0
                    ? "Due today!"
                    : `${daysLeft} days left`}
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
        <div className="flex items-center gap-2">
          {bill.status === "PENDING" || bill.status === "OVERDUE" ? (
            <Button
              size="sm"
              className="h-8 text-xs"
              onClick={() => handlePayNow(bill)}
            >
              Pay Now
            </Button>
          ) : bill.status === "PAID" ? (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => handleDownloadReceipt(bill)}
            >
              <Download className="h-3 w-3 mr-1" />
              Receipt
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  const handlePayNow = (bill: Bill) => {
    // Generate UPI payment link
    const upiId = "society@upi";
    const amount = Number(bill.total_amount);
    const note = `Maintenance ${bill.bill_number}`;
    const upiLink = `upi://pay?pa=${upiId}&am=${amount}&tn=${note}&cu=INR`;

    // Open UPI app
    window.open(upiLink, "_blank");

    // Show instructions
    alert(
      `Payment Instructions:\n\n` +
        `Amount: ${formatINR(amount)}\n` +
        `Bill: ${bill.bill_number}\n\n` +
        `1. Pay via UPI app\n` +
        `2. Take screenshot of payment\n` +
        `3. Share with your treasurer for confirmation`,
    );
  };

  const handleDownloadReceipt = (bill: Bill) => {
    // Simple receipt download
    const receipt = `
SOCIETYOS — PAYMENT RECEIPT
============================
Bill Number: ${bill.bill_number}
Period: ${MONTHS[bill.billing_month - 1]} ${bill.billing_year}
Amount Paid: ${formatINR(Number(bill.amount_paid))}
Payment Date: ${bill.paid_at ? formatDateShort(bill.paid_at) : "N/A"}
Status: PAID
============================
Thank you for your payment!
    `.trim();

    const blob = new Blob([receipt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt-${bill.bill_number}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Bills"
        description="View and pay your maintenance bills"
        icon={CreditCard}
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatsCard
          title="Total Paid"
          value={formatINR(stats.totalPaid)}
          icon={CheckCircle}
          color="green"
        />
        <StatsCard
          title="Pending"
          value={formatINR(stats.totalPending)}
          icon={Clock}
          color="yellow"
        />
        <StatsCard
          title="Overdue"
          value={formatINR(stats.totalOverdue)}
          icon={AlertTriangle}
          color={stats.totalOverdue > 0 ? "red" : "green"}
        />
        <StatsCard
          title="Total Bills"
          value={pagination.total}
          icon={IndianRupee}
          color="blue"
        />
      </div>

      {/* Bills Table Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">All Bills</CardTitle>

            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-36 h-8 text-sm">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Bills</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                  <SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
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
            keyExtractor={(bill) => bill.id}
            emptyTitle="No bills found"
            emptyDescription={
              statusFilter !== "ALL"
                ? `No ${statusFilter.toLowerCase()} bills found`
                : "Your bills will appear here once generated"
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
            limit={10}
          />
        </CardContent>
      </Card>
    </div>
  );
}
