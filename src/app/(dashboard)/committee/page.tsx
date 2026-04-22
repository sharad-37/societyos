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
import { AppleStatsCard } from "@/components/ui/apple-components";
import { formatDateShort } from "@/lib/utils";

interface Complaint {
  id: string;
  complaint_number: string;
  category: string;
  priority: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  raised_by_user: {
    full_name: string;
    flat: { flat_number: string } | null;
  } | null;
  assigned_to_user: { full_name: string } | null;
}

const STATUS_FLOW: Record<string, string[]> = {
  OPEN: ["ASSIGNED", "REJECTED"],
  ASSIGNED: ["IN_PROGRESS", "OPEN"],
  IN_PROGRESS: ["RESOLVED", "ASSIGNED"],
  RESOLVED: ["CLOSED"],
  CLOSED: [],
  REJECTED: [],
};

export default function CommitteeComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(
    null,
  );
  const [showModal, setShowModal] = useState(false);
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
  const [updateForm, setUpdateForm] = useState({ newStatus: "", note: "" });
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter, priorityFilter, page]);

  const fetchComplaints = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "15",
        ...(statusFilter !== "ALL" && { status: statusFilter }),
        ...(priorityFilter !== "ALL" && { priority: priorityFilter }),
      });
      const res = await fetch(`/api/complaints?${params}`);
      const data = await res.json();
      if (data.success) {
        const all: Complaint[] = data.data || [];
        setComplaints(all);
        setPagination({
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 1,
          hasNext: data.pagination?.hasNext || false,
          hasPrev: data.pagination?.hasPrev || false,
        });
        setStats({
          open: all.filter((c) => c.status === "OPEN").length,
          inProgress: all.filter((c) =>
            ["IN_PROGRESS", "ASSIGNED"].includes(c.status),
          ).length,
          resolved: all.filter((c) => ["RESOLVED", "CLOSED"].includes(c.status))
            .length,
          urgent: all.filter((c) => c.priority === "URGENT").length,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedComplaint) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/complaints/${selectedComplaint.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: updateForm.newStatus,
          note: updateForm.note,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Complaint updated");
        setShowModal(false);
        fetchComplaints();
      } else toast.error(data.message);
    } catch {
      toast.error("Network error");
    } finally {
      setIsUpdating(false);
    }
  };

  const columns = [
    {
      key: "id",
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
            {c.raised_by_user?.full_name}
          </p>
        </div>
      ),
    },
    {
      key: "title",
      label: "Issue",
      render: (c: Complaint) => (
        <div className="max-w-[180px]">
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
      key: "date",
      label: "Date",
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
          disabled={["CLOSED", "REJECTED"].includes(c.status)}
          onClick={() => {
            setSelectedComplaint(c);
            setUpdateForm({ newStatus: c.status, note: "" });
            setShowModal(true);
          }}
        >
          Manage <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Complaint Management"
        description="Track and resolve resident complaints"
        icon={MessageSquare}
        action={
          <Button variant="outline" size="sm" onClick={fetchComplaints}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        }
      />

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

      <div className="apple-card overflow-hidden">
        <div className="p-5 pb-4 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-700/50">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
            All Complaints ({pagination.total})
          </h3>
          <div className="flex gap-2">
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
            emptyDescription="All complaints appear here"
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedComplaint?.complaint_number}</DialogTitle>
          </DialogHeader>
          {selectedComplaint && (
            <div className="space-y-4">
              <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800 border p-4 space-y-2">
                <p className="text-sm font-semibold">
                  {selectedComplaint.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedComplaint.description}
                </p>
                <div className="flex gap-2">
                  <StatusBadge
                    status={selectedComplaint.priority}
                    type="complaint-priority"
                  />
                  <StatusBadge
                    status={selectedComplaint.status}
                    type="complaint-status"
                  />
                </div>
              </div>
              {(STATUS_FLOW[selectedComplaint.status] || []).length > 0 && (
                <div className="space-y-3">
                  <Label>Update Status</Label>
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
                        {selectedComplaint.status} (Current)
                      </SelectItem>
                      {(STATUS_FLOW[selectedComplaint.status] || []).map(
                        (s) => (
                          <SelectItem key={s} value={s}>
                            → {s.replace(/_/g, " ")}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                  <Textarea
                    placeholder="Add a note..."
                    value={updateForm.note}
                    onChange={(e) =>
                      setUpdateForm({ ...updateForm, note: e.target.value })
                    }
                    rows={3}
                  />
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleUpdate}
                      disabled={
                        isUpdating ||
                        updateForm.newStatus === selectedComplaint.status
                      }
                    >
                      {isUpdating ? "Updating..." : "Update Status"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
