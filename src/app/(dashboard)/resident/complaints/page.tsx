// src/app/(dashboard)/resident/complaints/page.tsx
"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  MessageSquare,
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle,
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
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Pagination } from "@/components/shared/Pagination";
import { AppleStatsCard } from "@/components/ui/apple-components";
import { formatDateShort } from "@/lib/utils";

interface Complaint {
  id: string;
  complaint_number: string;
  category: string;
  priority: string;
  title: string;
  status: string;
  created_at: string;
  assigned_to_user: { full_name: string } | null;
}

const CATEGORIES = [
  "PLUMBING",
  "ELECTRICAL",
  "CLEANING",
  "SECURITY",
  "LIFT",
  "PARKING",
  "NOISE",
  "INTERNET",
  "GAS",
  "OTHER",
];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export default function ResidentComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [form, setForm] = useState({
    category: "",
    priority: "MEDIUM",
    title: "",
    description: "",
    location: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchComplaints();
  }, [page]);

  const fetchComplaints = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/complaints?page=${page}&limit=10`);
      const data = await res.json();
      if (data.success) {
        setComplaints(data.data || []);
        setPagination({
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 1,
          hasNext: data.pagination?.hasNext || false,
          hasPrev: data.pagination?.hasPrev || false,
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
    const errors: Record<string, string> = {};
    if (!form.category) errors.category = "Required";
    if (form.title.length < 10) errors.title = "Min 10 characters";
    if (form.description.length < 20) errors.description = "Min 20 characters";
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setShowForm(false);
        setForm({
          category: "",
          priority: "MEDIUM",
          title: "",
          description: "",
          location: "",
        });
        fetchComplaints();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCount = complaints.filter((c) => c.status === "OPEN").length;
  const inProgressCount = complaints.filter((c) =>
    ["IN_PROGRESS", "ASSIGNED"].includes(c.status),
  ).length;
  const resolvedCount = complaints.filter((c) =>
    ["RESOLVED", "CLOSED"].includes(c.status),
  ).length;

  const columns = [
    {
      key: "complaint_number",
      label: "ID",
      render: (c: Complaint) => (
        <span className="font-mono text-xs text-muted-foreground">
          {c.complaint_number}
        </span>
      ),
    },
    {
      key: "title",
      label: "Issue",
      render: (c: Complaint) => (
        <div>
          <p className="text-sm font-medium line-clamp-1">{c.title}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {c.category.toLowerCase()} · {formatDateShort(c.created_at)}
          </p>
        </div>
      ),
    },
    {
      key: "priority",
      label: "Priority",
      render: (c: Complaint) => (
        <StatusBadge status={c.priority} type="complaint-priority" />
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (c: Complaint) => (
        <StatusBadge status={c.status} type="complaint-status" />
      ),
    },
    {
      key: "assigned",
      label: "Assigned To",
      render: (c: Complaint) => (
        <span className="text-sm text-muted-foreground">
          {c.assigned_to_user?.full_name || "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Complaints"
        description="Raise and track complaints"
        icon={MessageSquare}
        action={
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Complaint
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <AppleStatsCard
          label="Open"
          value={openCount}
          icon={AlertTriangle}
          iconColor={openCount > 0 ? "bg-red-500" : "bg-green-500"}
        />
        <AppleStatsCard
          label="In Progress"
          value={inProgressCount}
          icon={Clock}
          iconColor="bg-amber-500"
        />
        <AppleStatsCard
          label="Resolved"
          value={resolvedCount}
          icon={CheckCircle}
          iconColor="bg-green-500"
        />
      </div>

      <div className="apple-card overflow-hidden">
        <div className="p-5 pb-4 border-b border-zinc-100 dark:border-zinc-700/50">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
            All Complaints ({pagination.total})
          </h3>
        </div>
        <div className="p-5">
          <DataTable
            data={complaints}
            columns={columns}
            isLoading={isLoading}
            keyExtractor={(c) => c.id}
            emptyTitle="No complaints yet"
            emptyDescription="Raise a complaint if you face any issues"
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

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Raise a Complaint</DialogTitle>
            <DialogDescription>Describe your issue clearly</DialogDescription>
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
                        {c.charAt(0) + c.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.category && (
                  <p className="text-xs text-red-500">{formErrors.category}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm({ ...form, priority: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p.charAt(0) + p.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                placeholder="Brief description"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              {formErrors.title && (
                <p className="text-xs text-red-500">{formErrors.title}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                placeholder="Detailed description..."
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={4}
              />
              {formErrors.description && (
                <p className="text-xs text-red-500">{formErrors.description}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                placeholder="e.g. Lobby, Floor 3"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Complaint"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
