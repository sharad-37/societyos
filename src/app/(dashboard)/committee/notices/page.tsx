// src/app/(dashboard)/committee/complaints/page.tsx
"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  MessageSquare,
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Pagination } from "@/components/shared/Pagination";
import {
  AppleStatsCard,
  AppleCardSkeleton,
} from "@/components/ui/apple-components";
import { formatDateShort } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────
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
  sla_breached: boolean;
  raised_by_user: {
    full_name: string;
    flat: { flat_number: string } | null;
  } | null;
  assigned_to_user: { full_name: string } | null;
  updates: any[];
}

// ─── Status Flow ──────────────────────────────────────────────
const STATUS_FLOW: Record<string, string[]> = {
  OPEN: ["ASSIGNED", "REJECTED"],
  ASSIGNED: ["IN_PROGRESS", "OPEN"],
  IN_PROGRESS: ["RESOLVED", "ASSIGNED"],
  RESOLVED: ["CLOSED"],
  CLOSED: [],
  REJECTED: [],
};

// ─── Component ────────────────────────────────────────────────
export default function CommitteeComplaintsPage() {
  // ── State ──────────────────────────────────────────────────
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(
    null,
  );
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [stats, setStats] = useState({
    open: 0,
    inProgress: 0,
    resolved: 0,
    urgent: 0,
  });

  // Update form
  const [updateForm, setUpdateForm] = useState({
    newStatus: "",
    note: "",
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");

  // ── Effects ────────────────────────────────────────────────
  useEffect(() => {
    fetchComplaints();
  }, [statusFilter, priorityFilter, page]);

  // ── Fetch ──────────────────────────────────────────────────
  const fetchComplaints = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "15",
        ...(statusFilter !== "ALL" && { status: statusFilter }),
        ...(priorityFilter !== "ALL" && { priority: priorityFilter }),
      });

      const response = await fetch(`/api/complaints?${params}`);
      const data = await response.json();

      if (data.success) {
        const allComplaints: Complaint[] = data.data || [];
        setComplaints(allComplaints);
        setPagination({
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 1,
          hasNext: data.pagination?.hasNext || false,
          hasPrev: data.pagination?.hasPrev || false,
        });
        setStats({
          open: allComplaints.filter((c) => c.status === "OPEN").length,
          inProgress: allComplaints.filter((c) =>
            ["IN_PROGRESS", "ASSIGNED"].includes(c.status),
          ).length,
          resolved: allComplaints.filter((c) =>
            ["RESOLVED", "CLOSED"].includes(c.status),
          ).length,
          urgent: allComplaints.filter((c) => c.priority === "URGENT").length,
        });
      }
    } catch (error) {
      console.error("Failed to fetch complaints:", error);
      toast.error("Failed to load complaints");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Handlers ───────────────────────────────────────────────
  const handleOpenDetail = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setUpdateForm({ newStatus: complaint.status, note: "" });
    setUpdateError("");
    setShowDetailModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedComplaint) return;
    setIsUpdating(true);
    setUpdateError("");

    try {
      const response = await fetch(`/api/complaints/${selectedComplaint.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: updateForm.newStatus,
          note: updateForm.note,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Complaint updated successfully");
        setShowDetailModal(false);
        setSelectedComplaint(null);
        fetchComplaints();
      } else {
        setUpdateError(data.message || "Failed to update complaint");
        toast.error(data.message || "Failed to update");
      }
    } catch {
      setUpdateError("Network error. Please try again.");
      toast.error("Network error");
    } finally {
      setIsUpdating(false);
    }
  };

  // ── Table Columns ──────────────────────────────────────────
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
      key: "flat",
      label: "Flat",
      render: (c: Complaint) => (
        <div>
          <p className="text-sm font-medium">
            {c.raised_by_user?.flat?.flat_number || "N/A"}
          </p>
          <p className="text-xs text-muted-foreground truncate max-w-[100px]">
            {c.raised_by_user?.full_name || "Unknown"}
          </p>
        </div>
      ),
    },
    {
      key: "title",
      label: "Issue",
      render: (c: Complaint) => (
        <div className="max-w-[200px]">
          <p className="text-sm font-medium line-clamp-1">{c.title}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {c.category.toLowerCase()}
          </p>
        </div>
      ),
    },
    {
      key: "priority",
      label: "Priority",
      render: (c: Complaint) => (
        <div className="flex flex-col gap-1">
          <StatusBadge status={c.priority} type="complaint-priority" />
          {c.sla_breached && (
            <span className="text-xs text-red-600 font-medium">
              SLA breached
            </span>
          )}
        </div>
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
    {
      key: "created_at",
      label: "Raised On",
      render: (c: Complaint) => (
        <span className="text-xs text-muted-foreground">
          {formatDateShort(c.created_at)}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (c: Complaint) => (
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={() => handleOpenDetail(c)}
          disabled={c.status === "CLOSED" || c.status === "REJECTED"}
        >
          Manage
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      ),
    },
  ];

  // Available next statuses for selected complaint
  const availableStatuses = selectedComplaint
    ? STATUS_FLOW[selectedComplaint.status] || []
    : [];

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Complaint Management"
        description="Track and resolve resident complaints"
        icon={MessageSquare}
        action={
          <Button variant="outline" size="sm" onClick={() => fetchComplaints()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
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
            label="Open"
            value={stats.open}
            icon={AlertTriangle}
            iconColor={stats.open > 0 ? "bg-red-500" : "bg-green-500"}
            sublabel="Need attention"
          />
          <AppleStatsCard
            label="In Progress"
            value={stats.inProgress}
            icon={Clock}
            iconColor="bg-amber-500"
            sublabel="Being resolved"
          />
          <AppleStatsCard
            label="Resolved"
            value={stats.resolved}
            icon={CheckCircle}
            iconColor="bg-green-500"
            sublabel="Completed"
          />
          <AppleStatsCard
            label="Urgent"
            value={stats.urgent}
            icon={AlertTriangle}
            iconColor={stats.urgent > 0 ? "bg-red-500" : "bg-green-500"}
            sublabel="High priority"
          />
        </div>
      )}

      {/* Filters + Table */}
      <div className="apple-card overflow-hidden">
        <div className="p-5 pb-4 flex items-center justify-between flex-wrap gap-3 border-b border-zinc-100 dark:border-zinc-700/50">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
            All Complaints
            {pagination.total > 0 && (
              <span className="ml-2 text-xs font-normal text-zinc-400">
                ({pagination.total} total)
              </span>
            )}
          </h3>

          <div className="flex items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-32 h-8 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="ASSIGNED">Assigned</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={priorityFilter}
              onValueChange={(v) => {
                setPriorityFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-32 h-8 text-sm">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Priority</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="p-5">
          <DataTable
            data={complaints}
            columns={columns}
            isLoading={isLoading}
            keyExtractor={(c) => c.id}
            emptyTitle="No complaints found"
            emptyDescription="All complaints will appear here"
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

      {/* ── Complaint Detail Modal ──────────────────────────── */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedComplaint?.complaint_number}</DialogTitle>
          </DialogHeader>

          {selectedComplaint && (
            <div className="space-y-4">
              {/* Complaint Details */}
              <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-4 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Issue</p>
                  <p className="text-sm font-semibold mt-0.5">
                    {selectedComplaint.title}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Description</p>
                  <p className="text-sm mt-0.5 text-zinc-700 dark:text-zinc-300">
                    {selectedComplaint.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Raised By</p>
                    <p className="text-sm font-medium mt-0.5">
                      {selectedComplaint.raised_by_user?.full_name || "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Flat{" "}
                      {selectedComplaint.raised_by_user?.flat?.flat_number ||
                        "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Raised On</p>
                    <p className="text-sm font-medium mt-0.5">
                      {formatDateShort(selectedComplaint.created_at)}
                    </p>
                  </div>
                </div>

                {selectedComplaint.location && (
                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="text-sm mt-0.5">
                      {selectedComplaint.location}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <StatusBadge
                    status={selectedComplaint.priority}
                    type="complaint-priority"
                  />
                  <StatusBadge
                    status={selectedComplaint.status}
                    type="complaint-status"
                  />
                </div>

                {selectedComplaint.assigned_to_user && (
                  <div>
                    <p className="text-xs text-muted-foreground">Assigned To</p>
                    <p className="text-sm font-medium mt-0.5">
                      {selectedComplaint.assigned_to_user.full_name}
                    </p>
                  </div>
                )}

                {selectedComplaint.resolved_at && (
                  <div>
                    <p className="text-xs text-muted-foreground">Resolved On</p>
                    <p className="text-sm font-medium mt-0.5 text-green-600">
                      {formatDateShort(selectedComplaint.resolved_at)}
                    </p>
                  </div>
                )}
              </div>

              {/* Status Update Form */}
              {availableStatuses.length > 0 ? (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Update Status</Label>

                  <Select
                    value={updateForm.newStatus}
                    onValueChange={(v) =>
                      setUpdateForm({ ...updateForm, newStatus: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={selectedComplaint.status}>
                        {selectedComplaint.status.replace(/_/g, " ")} (Current)
                      </SelectItem>
                      {availableStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          → {status.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="space-y-2">
                    <Label className="text-sm">Note (Optional)</Label>
                    <Textarea
                      placeholder="Add a note about this status update..."
                      value={updateForm.note}
                      onChange={(e) =>
                        setUpdateForm({
                          ...updateForm,
                          note: e.target.value,
                        })
                      }
                      rows={3}
                    />
                  </div>

                  {/* Error */}
                  {updateError && (
                    <div className="rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 p-3">
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {updateError}
                      </p>
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="flex gap-3 pt-1">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowDetailModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleUpdateStatus}
                      disabled={
                        isUpdating ||
                        updateForm.newStatus === selectedComplaint.status
                      }
                    >
                      {isUpdating ? "Updating..." : "Update Status"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-4 text-center">
                  <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    This complaint is{" "}
                    {selectedComplaint.status.toLowerCase().replace(/_/g, " ")}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
