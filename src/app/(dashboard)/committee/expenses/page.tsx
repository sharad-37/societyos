// src/app/(dashboard)/committee/expenses/page.tsx
"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  Plus,
  CheckCircle,
  Clock,
  XCircle,
  IndianRupee,
  Filter,
  RefreshCw,
  Receipt,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { StatsCard } from "@/components/shared/StatsCard";
import { Pagination } from "@/components/shared/Pagination";
import { formatINR, formatDateShort } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface Expense {
  id: string;
  category: string;
  title: string;
  description: string | null;
  amount: string;
  expense_date: string;
  vendor_name: string | null;
  receipt_url: string | null;
  status: string;
  added_by_user?: { full_name: string };
  approved_at: string | null;
}

const CATEGORIES = [
  "MAINTENANCE",
  "SECURITY",
  "CLEANING",
  "ELECTRICITY",
  "WATER",
  "LIFT",
  "GARDEN",
  "INSURANCE",
  "LEGAL",
  "ADMINISTRATIVE",
  "EMERGENCY",
  "OTHER",
];

const CATEGORY_ICONS: Record<string, string> = {
  MAINTENANCE: "🔧",
  SECURITY: "🔐",
  CLEANING: "🧹",
  ELECTRICITY: "⚡",
  WATER: "💧",
  LIFT: "🛗",
  GARDEN: "🌿",
  INSURANCE: "🛡️",
  LEGAL: "⚖️",
  ADMINISTRATIVE: "📋",
  EMERGENCY: "🚨",
  OTHER: "📦",
};

export default function ExpensesPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [stats, setStats] = useState({
    totalThisMonth: 0,
    totalApproved: 0,
    pendingApproval: 0,
    totalExpenses: 0,
  });

  // Form state
  const [form, setForm] = useState({
    category: "",
    title: "",
    description: "",
    amount: "",
    expense_date: new Date().toISOString().split("T")[0],
    vendor_name: "",
  });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const isTreasurer = ["TREASURER", "PRESIDENT", "ADMIN"].includes(
    user?.role || "",
  );
  const isPresident = ["PRESIDENT", "ADMIN"].includes(user?.role || "");

  useEffect(() => {
    fetchExpenses();
  }, [statusFilter, categoryFilter, page]);

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "15",
        ...(statusFilter !== "ALL" && { status: statusFilter }),
        ...(categoryFilter !== "ALL" && { category: categoryFilter }),
      });

      const response = await fetch(`/api/expenses?${params}`);
      const data = await response.json();

      if (data.success) {
        const allExpenses = data.data || [];
        setExpenses(allExpenses);
        setPagination({
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 1,
          hasNext: data.pagination?.hasNext || false,
          hasPrev: data.pagination?.hasPrev || false,
        });

        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();

        setStats({
          totalThisMonth: allExpenses
            .filter((e: Expense) => {
              const d = new Date(e.expense_date);
              return (
                d.getMonth() === thisMonth &&
                d.getFullYear() === thisYear &&
                e.status === "APPROVED"
              );
            })
            .reduce((s: number, e: Expense) => s + Number(e.amount), 0),
          totalApproved: allExpenses
            .filter((e: Expense) => e.status === "APPROVED")
            .reduce((s: number, e: Expense) => s + Number(e.amount), 0),
          pendingApproval: allExpenses.filter(
            (e: Expense) => e.status === "PENDING_APPROVAL",
          ).length,
          totalExpenses: data.pagination?.total || 0,
        });
      }
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category || !form.title || !form.amount) {
      setFormError("Please fill in all required fields");
      return;
    }
    if (isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      setFormError("Please enter a valid amount");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setFormSuccess("Expense added successfully!");
        setForm({
          category: "",
          title: "",
          description: "",
          amount: "",
          expense_date: new Date().toISOString().split("T")[0],
          vendor_name: "",
        });
        fetchExpenses();
        setTimeout(() => {
          setShowAddModal(false);
          setFormSuccess("");
        }, 1500);
      } else {
        setFormError(data.message || "Failed to add expense");
      }
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (expenseId: string) => {
    try {
      const response = await fetch(`/api/expenses/${expenseId}/approve`, {
        method: "POST",
      });
      const data = await response.json();
      if (data.success) fetchExpenses();
    } catch (error) {
      console.error("Failed to approve expense:", error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING_APPROVAL: "text-yellow-600 bg-yellow-50 border-yellow-200",
      APPROVED: "text-green-600 bg-green-50 border-green-200",
      REJECTED: "text-red-600 bg-red-50 border-red-200",
      PAID: "text-blue-600 bg-blue-50 border-blue-200",
    };
    return colors[status] || "text-gray-600 bg-gray-50";
  };

  const columns = [
    {
      key: "category",
      label: "Category",
      render: (e: Expense) => (
        <div className="flex items-center gap-2">
          <span className="text-lg">{CATEGORY_ICONS[e.category] || "📦"}</span>
          <span className="text-xs font-medium text-muted-foreground capitalize">
            {e.category.toLowerCase()}
          </span>
        </div>
      ),
    },
    {
      key: "title",
      label: "Expense",
      render: (e: Expense) => (
        <div className="max-w-[180px]">
          <p className="text-sm font-medium line-clamp-1">{e.title}</p>
          {e.vendor_name && (
            <p className="text-xs text-muted-foreground">{e.vendor_name}</p>
          )}
        </div>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      render: (e: Expense) => (
        <span className="font-semibold text-sm">
          {formatINR(Number(e.amount))}
        </span>
      ),
    },
    {
      key: "expense_date",
      label: "Date",
      render: (e: Expense) => (
        <span className="text-sm text-muted-foreground">
          {formatDateShort(e.expense_date)}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (e: Expense) => (
        <span
          className={`
          inline-flex items-center rounded-full border px-2.5 py-0.5
          text-xs font-semibold ${getStatusColor(e.status)}
        `}
        >
          {e.status.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (e: Expense) => (
        <div className="flex items-center gap-1">
          {e.status === "PENDING_APPROVAL" && isPresident && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs text-green-700 border-green-200 hover:bg-green-50"
              onClick={() => handleApprove(e.id)}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Approve
            </Button>
          )}
          {e.receipt_url && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => window.open(e.receipt_url!, "_blank")}
            >
              <Receipt className="h-3 w-3" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fund Ledger"
        description="Track all society expenses transparently"
        icon={TrendingUp}
        action={
          isTreasurer ? (
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          ) : undefined
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatsCard
          title="This Month"
          value={formatINR(stats.totalThisMonth)}
          icon={IndianRupee}
          color="blue"
          subtitle="Approved expenses"
        />
        <StatsCard
          title="Total Approved"
          value={formatINR(stats.totalApproved)}
          icon={CheckCircle}
          color="green"
          subtitle="All time"
        />
        <StatsCard
          title="Pending Approval"
          value={stats.pendingApproval}
          icon={Clock}
          color={stats.pendingApproval > 0 ? "yellow" : "green"}
          subtitle="Needs review"
        />
        <StatsCard
          title="Total Entries"
          value={stats.totalExpenses}
          icon={TrendingUp}
          color="default"
          subtitle="All expenses"
        />
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base font-semibold">
              Expense Records
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchExpenses}
                className="h-8"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh
              </Button>
              <Select
                value={categoryFilter}
                onValueChange={(v) => {
                  setCategoryFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-36 h-8 text-sm">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {CATEGORY_ICONS[cat]}{" "}
                      {cat.charAt(0) + cat.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-36 h-8 text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="PENDING_APPROVAL">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={expenses}
            columns={columns}
            isLoading={isLoading}
            keyExtractor={(e) => e.id}
            emptyTitle="No expenses recorded"
            emptyDescription="Add expenses to track society fund usage"
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

      {/* Add Expense Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Expense</DialogTitle>
            <DialogDescription>
              Record a society expense for transparency
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {CATEGORY_ICONS[cat]}{" "}
                        {cat.charAt(0) + cat.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Amount (₹) *</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  min="1"
                  step="0.01"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                placeholder="e.g. Monthly security guard salary"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vendor Name</Label>
                <Input
                  placeholder="Company or person name"
                  value={form.vendor_name}
                  onChange={(e) =>
                    setForm({ ...form, vendor_name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={form.expense_date}
                  onChange={(e) =>
                    setForm({ ...form, expense_date: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional details about this expense..."
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={3}
              />
            </div>

            {formError && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-600">{formError}</p>
              </div>
            )}

            {formSuccess && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <p className="text-sm text-green-700">{formSuccess}</p>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Expense"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
