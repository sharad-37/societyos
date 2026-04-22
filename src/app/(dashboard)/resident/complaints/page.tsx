// src/app/(dashboard)/resident/complaints/page.tsx
"use client";

import { useEffect, useState } from "react";
import {
  MessageSquare,
  Plus,
  X,
  AlertTriangle,
  Clock,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { StatsCard } from "@/components/shared/StatsCard";
import { Pagination } from "@/components/shared/Pagination";
import { formatDateShort } from "@/lib/utils";

interface Complaint {
  id: string;
  complaint_number: string;
  category: string;
  priority: string;
  title: string;
  description: string;
  status: string;
  location: string | null;
  created_at: string;
  resolved_at: string | null;
  assigned_to_user: { full_name: string } | null;
  updates: any[];
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

  // Form state
  const [form, setForm] = useState({
    category: "",
    priority: "MEDIUM",
    title: "",
    description: "",
    location: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  useEffect(() => {
    fetchComplaints();
  }, [page]);

  const fetchComplaints = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/complaints?page=${page}&limit=10`);
      const data = await response.json();

      if (data.success) {
        setComplaints(data.data || []);
        setPagination({
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 1,
          hasNext: data.pagination?.hasNext || false,
          hasPrev: data.pagination?.hasPrev || false,
        });
      }
    } catch (error) {
      console.error("Failed to fetch complaints:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!form.category) errors.category = "Please select a category";
    if (!form.title || form.title.length < 10)
      errors.title = "Title must be at least 10 characters";
    if (!form.description || form.description.length < 20)
      errors.description = "Description must be at least 20 characters";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError("");
    setSubmitSuccess("");

    try {
      const response = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitSuccess(data.message);
        setForm({
          category: "",
          priority: "MEDIUM",
          title: "",
          description: "",
          location: "",
        });
        setShowForm(false);
        fetchComplaints(); // Refresh list
      } else {
        setSubmitError(data.message || "Failed to submit complaint");
      }
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stats
  const openCount = complaints.filter((c) => c.status === "OPEN").length;
  const inProgressCount = complaints.filter(
    (c) => c.status === "IN_PROGRESS" || c.status === "ASSIGNED",
  ).length;
  const resolvedCount = complaints.filter(
    (c) => c.status === "RESOLVED" || c.status === "CLOSED",
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
      label: "Complaint",
      render: (c: Complaint) => (
        <div>
          <p className="text-sm font-medium line-clamp-1">{c.title}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {c.category.toLowerCase()} • {formatDateShort(c.created_at)}
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
      key: "assigned_to",
      label: "Assigned To",
      render: (c: Complaint) => (
        <span className="text-sm text-muted-foreground">
          {c.assigned_to_user?.full_name || "—"}
        </span>
      ),
    },
    {
      key: "resolved_at",
      label: "Resolved",
      render: (c: Complaint) => (
        <span className="text-sm text-muted-foreground">
          {c.resolved_at ? formatDateShort(c.resolved_at) : "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Complaints"
        description="Raise and track your complaints"
        icon={MessageSquare}
        action={
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Complaint
          </Button>
        }
      />

      {/* Success message */}
      {submitSuccess && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <p className="text-sm font-medium text-green-800">
              {submitSuccess}
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatsCard
          title="Open"
          value={openCount}
          icon={AlertTriangle}
          color={openCount > 0 ? "red" : "green"}
        />
        <StatsCard
          title="In Progress"
          value={inProgressCount}
          icon={Clock}
          color="yellow"
        />
        <StatsCard
          title="Resolved"
          value={resolvedCount}
          icon={CheckCircle}
          color="green"
        />
      </div>

      {/* Complaints Table */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">
            All Complaints ({pagination.total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={complaints}
            columns={columns}
            isLoading={isLoading}
            keyExtractor={(c) => c.id}
            emptyTitle="No complaints yet"
            emptyDescription="Raise a complaint if you face any issues in the society"
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

      {/* New Complaint Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Raise a Complaint</DialogTitle>
            <DialogDescription>
              Describe your issue and we'll get it resolved
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {/* Category + Priority Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat.charAt(0) + cat.slice(1).toLowerCase()}
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

            {/* Title */}
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                placeholder="Brief description of the issue"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                maxLength={300}
              />
              {formErrors.title && (
                <p className="text-xs text-red-500">{formErrors.title}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                placeholder="Provide detailed description of the problem..."
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={4}
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground text-right">
                {form.description.length}/2000
              </p>
              {formErrors.description && (
                <p className="text-xs text-red-500">{formErrors.description}</p>
              )}
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label>Location (Optional)</Label>
              <Input
                placeholder="e.g. Lobby, Parking area, Floor 3"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>

            {/* Error */}
            {submitError && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-600">{submitError}</p>
              </div>
            )}

            {/* Buttons */}
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
