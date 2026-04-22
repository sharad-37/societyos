// src/app/(dashboard)/committee/expenses/page.tsx
"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  TrendingUp,
  Plus,
  CheckCircle,
  Clock,
  IndianRupee,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { AppleStatsCard } from "@/components/ui/apple-components";
import { formatINR, formatDateShort } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface Expense {
  id: string;
  category: string;
  title: string;
  amount: string;
  expense_date: string;
  vendor_name: string | null;
  status: string;
  added_by_user?: { full_name: string };
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
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [stats, setStats] = useState({
    totalApproved: 0,
    pendingApproval: 0,
    total: 0,
  });
  const [form, setForm] = useState({
    category: "",
    title: "",
    description: "",
    amount: "",
    expense_date: new Date().toISOString().split("T")[0],
    vendor_name: "",
  });
  const isPresident = ["PRESIDENT", "ADMIN"].includes(user?.role || "");
  const isTreasurer = ["TREASURER", "PRESIDENT", "ADMIN"].includes(
    user?.role || "",
  );

  useEffect(() => {
    fetchExpenses();
  }, [statusFilter, page]);

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "15",
        ...(statusFilter !== "ALL" && { status: statusFilter }),
      });
      const res = await fetch(`/api/expenses?${params}`);
      const data = await res.json();
      if (data.success) {
        const all: Expense[] = data.data || [];
        setExpenses(all);
        setPagination({
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 1,
          hasNext: data.pagination?.hasNext || false,
          hasPrev: data.pagination?.hasPrev || false,
        });
        setStats({
          totalApproved: all
            .filter((e) => e.status === "APPROVED")
            .reduce((s, e) => s + Number(e.amount), 0),
          pendingApproval: all.filter((e) => e.status === "PENDING_APPROVAL")
            .length,
          total: data.pagination?.total || 0,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category || !form.title || !form.amount) {
      toast.error("Fill all required fields");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Expense added!");
        setShowModal(false);
        setForm({
          category: "",
          title: "",
          description: "",
          amount: "",
          expense_date: new Date().toISOString().split("T")[0],
          vendor_name: "",
        });
        fetchExpenses();
      } else toast.error(data.message);
    } catch {
      toast.error("Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/expenses/${id}/approve`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Approved!");
        fetchExpenses();
      }
    } catch {
      toast.error("Network error");
    }
  };

  const getStatusColor = (s: string) =>
    ({
      PENDING_APPROVAL: "text-amber-600 bg-amber-50",
      APPROVED: "text-green-600 bg-green-50",
      REJECTED: "text-red-600 bg-red-50",
      PAID: "text-blue-600 bg-blue-50",
    })[s] || "text-zinc-600 bg-zinc-50";

  const columns = [
    {
      key: "category",
      label: "Category",
      render: (e: Expense) => (
        <div className="flex items-center gap-2">
          <span className="text-lg">{CATEGORY_ICONS[e.category] || "📦"}</span>
          <span className="text-xs text-muted-foreground capitalize">
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
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(e.status)}`}
        >
          {e.status.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (e: Expense) =>
        e.status === "PENDING_APPROVAL" && isPresident ? (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs text-green-700 border-green-200"
            onClick={() => handleApprove(e.id)}
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Approve
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fund Ledger"
        description="Track all society expenses"
        icon={TrendingUp}
        action={
          isTreasurer ? (
            <Button size="sm" onClick={() => setShowModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <AppleStatsCard
          label="Total Approved"
          value={formatINR(stats.totalApproved)}
          icon={CheckCircle}
          iconColor="bg-green-500"
          sublabel="All time"
        />
        <AppleStatsCard
          label="Pending Approval"
          value={stats.pendingApproval}
          icon={Clock}
          iconColor={
            stats.pendingApproval > 0 ? "bg-amber-500" : "bg-green-500"
          }
          sublabel="Needs review"
        />
        <AppleStatsCard
          label="Total Entries"
          value={stats.total}
          icon={TrendingUp}
          iconColor="bg-blue-500"
          sublabel="All expenses"
        />
      </div>

      <div className="apple-card overflow-hidden">
        <div className="p-5 pb-4 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-700/50">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
            Expense Records
          </h3>
          <div className="flex gap-2">
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
                <SelectItem value="PENDING_APPROVAL">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="p-5">
          <DataTable
            data={expenses}
            columns={columns}
            isLoading={isLoading}
            keyExtractor={(e) => e.id}
            emptyTitle="No expenses recorded"
            emptyDescription="Add expenses to track fund usage"
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

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Expense</DialogTitle>
            <DialogDescription>Record a society expense</DialogDescription>
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
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {CATEGORY_ICONS[c]}{" "}
                        {c.charAt(0) + c.slice(1).toLowerCase()}
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
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                placeholder="Expense description"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vendor</Label>
                <Input
                  placeholder="Vendor name"
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
                placeholder="Additional details..."
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={3}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowModal(false)}
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
