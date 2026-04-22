// src/app/(dashboard)/committee/notices/page.tsx
"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Bell,
  Plus,
  Pin,
  AlertTriangle,
  Eye,
  Trash2,
  RefreshCw,
  Tag,
  Clock,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatsCard } from "@/components/shared/StatsCard";
import { Pagination } from "@/components/shared/Pagination";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────
interface Notice {
  id: string;
  title: string;
  content: string;
  category: string;
  is_pinned: boolean;
  is_urgent: boolean;
  created_at: string;
  expires_at: string | null;
  author: { full_name: string };
  views: { id: string }[];
}

// ─── Constants ────────────────────────────────────────────────
const CATEGORY_CONFIG: Record<string, { color: string; emoji: string }> = {
  GENERAL: { color: "bg-zinc-100 text-zinc-700", emoji: "📢" },
  MAINTENANCE: {
    color: "bg-blue-100 text-blue-700",
    emoji: "🔧",
  },
  MEETING: {
    color: "bg-purple-100 text-purple-700",
    emoji: "👥",
  },
  EMERGENCY: { color: "bg-red-100 text-red-700", emoji: "🚨" },
  FINANCIAL: {
    color: "bg-green-100 text-green-700",
    emoji: "💰",
  },
  LEGAL: {
    color: "bg-yellow-100 text-yellow-700",
    emoji: "⚖️",
  },
  EVENT: { color: "bg-pink-100 text-pink-700", emoji: "🎉" },
};

// ─── Component ────────────────────────────────────────────────
export default function CommitteeNoticesPage() {
  // ── State ──────────────────────────────────────────────────
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [stats, setStats] = useState({
    total: 0,
    pinned: 0,
    urgent: 0,
    thisMonth: 0,
  });

  // Form state
  const [form, setForm] = useState({
    title: "",
    content: "",
    category: "GENERAL",
    is_pinned: false,
    is_urgent: false,
    expires_at: "",
  });

  // ── Effects ────────────────────────────────────────────────
  useEffect(() => {
    fetchNotices();
  }, [categoryFilter, page]);

  // ── Fetch ──────────────────────────────────────────────────
  const fetchNotices = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
        ...(categoryFilter !== "ALL" && {
          category: categoryFilter,
        }),
      });

      const response = await fetch(`/api/notices?${params}`);
      const data = await response.json();

      if (data.success) {
        const allNotices: Notice[] = data.data || [];
        setNotices(allNotices);
        setPagination({
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 1,
          hasNext: data.pagination?.hasNext || false,
          hasPrev: data.pagination?.hasPrev || false,
        });

        const thisMonth = new Date().getMonth();
        setStats({
          total: data.pagination?.total || 0,
          pinned: allNotices.filter((n) => n.is_pinned).length,
          urgent: allNotices.filter((n) => n.is_urgent).length,
          thisMonth: allNotices.filter(
            (n) => new Date(n.created_at).getMonth() === thisMonth,
          ).length,
        });
      }
    } catch {
      toast.error("Failed to load notices");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Handlers ───────────────────────────────────────────────
  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Title and content are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          expires_at: form.expires_at || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Notice posted successfully! 📢");
        setShowCreateModal(false);
        setForm({
          title: "",
          content: "",
          category: "GENERAL",
          is_pinned: false,
          is_urgent: false,
          expires_at: "",
        });
        fetchNotices();
      } else {
        toast.error(data.message || "Failed to post notice");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNotice = async () => {
    if (!selectedNotice) return;

    try {
      const response = await fetch(`/api/notices/${selectedNotice.id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.success) {
        toast.success("Notice deleted successfully");
        setShowDeleteDialog(false);
        setSelectedNotice(null);
        fetchNotices();
      } else {
        toast.error(data.message || "Failed to delete notice");
      }
    } catch {
      toast.error("Network error");
    }
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Notice Board"
        description="Post and manage society announcements"
        icon={Bell}
        action={
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Post Notice
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatsCard
          title="Total Notices"
          value={stats.total}
          icon={Bell}
          color="blue"
          subtitle="All time"
        />
        <StatsCard
          title="Pinned"
          value={stats.pinned}
          icon={Pin}
          color="default"
          subtitle="Always on top"
        />
        <StatsCard
          title="Urgent"
          value={stats.urgent}
          icon={AlertTriangle}
          color={stats.urgent > 0 ? "red" : "green"}
          subtitle="High priority"
        />
        <StatsCard
          title="This Month"
          value={stats.thisMonth}
          icon={Clock}
          color="yellow"
          subtitle="Posted recently"
        />
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select
          value={categoryFilter}
          onValueChange={(v) => {
            setCategoryFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Categories</SelectItem>
            {Object.entries(CATEGORY_CONFIG).map(([key, val]) => (
              <SelectItem key={key} value={key}>
                {val.emoji} {key.charAt(0) + key.slice(1).toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={() => fetchNotices()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Notices List */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : notices.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notices yet"
          description="Post your first notice to keep residents informed"
          action={
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Post First Notice
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {notices.map((notice) => {
            const catConfig =
              CATEGORY_CONFIG[notice.category] || CATEGORY_CONFIG.GENERAL;

            return (
              <Card
                key={notice.id}
                className={cn(
                  "hover:shadow-sm transition-shadow",
                  notice.is_urgent && "border-red-200 bg-red-50/30",
                  notice.is_pinned && "border-zinc-300",
                )}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    {/* Left Content */}
                    <div className="flex-1 min-w-0">
                      {/* Title + Badges */}
                      <div className="flex items-start gap-2 flex-wrap mb-2">
                        <h3 className="text-sm font-semibold text-zinc-900">
                          {notice.title}
                        </h3>
                        {notice.is_pinned && (
                          <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
                            <Pin className="h-3 w-3" />
                            Pinned
                          </span>
                        )}
                        {notice.is_urgent && (
                          <span className="inline-flex items-center rounded-full bg-red-100 border border-red-200 px-2 py-0.5 text-xs font-semibold text-red-700">
                            <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                            Urgent
                          </span>
                        )}
                      </div>

                      {/* Content preview */}
                      <p className="text-xs text-zinc-600 line-clamp-2 mb-3">
                        {notice.content}
                      </p>

                      {/* Meta row */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                            catConfig.color,
                          )}
                        >
                          {catConfig.emoji}{" "}
                          {notice.category.charAt(0) +
                            notice.category.slice(1).toLowerCase()}
                        </span>

                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDate(notice.created_at)}
                        </span>

                        <span className="text-xs text-muted-foreground">
                          By {notice.author?.full_name}
                        </span>

                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Eye className="h-3 w-3" />
                          {notice.views?.length || 0} views
                        </span>

                        {notice.expires_at && (
                          <span className="text-xs text-amber-600">
                            Expires: {formatDate(notice.expires_at)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Delete Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                      onClick={() => {
                        setSelectedNotice(notice);
                        setShowDeleteDialog(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

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
      )}

      {/* ── CREATE NOTICE MODAL ───────────────────────────────── */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Post New Notice</DialogTitle>
            <DialogDescription>
              Create an announcement for all residents
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateNotice} className="space-y-4 mt-2">
            {/* Title */}
            <div className="space-y-2">
              <Label>Notice Title *</Label>
              <Input
                placeholder="e.g. Monthly Society Meeting — July 2024"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                maxLength={300}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_CONFIG).map(([key, val]) => (
                    <SelectItem key={key} value={key}>
                      {val.emoji} {key.charAt(0) + key.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label>Content *</Label>
              <Textarea
                placeholder="Write your notice here. Be clear and concise..."
                value={form.content}
                onChange={(e) =>
                  setForm({
                    ...form,
                    content: e.target.value,
                  })
                }
                rows={5}
                required
              />
              <p className="text-xs text-muted-foreground text-right">
                {form.content.length} characters
              </p>
            </div>

            {/* Expiry Date */}
            <div className="space-y-2">
              <Label>Expiry Date (Optional)</Label>
              <Input
                type="datetime-local"
                value={form.expires_at}
                onChange={(e) =>
                  setForm({
                    ...form,
                    expires_at: e.target.value,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Notice will be hidden after this date
              </p>
            </div>

            {/* Toggles */}
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border p-4">
                <div>
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Pin className="h-3.5 w-3.5" />
                    Pin Notice
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Always shows at top of notice board
                  </p>
                </div>
                <Switch
                  checked={form.is_pinned}
                  onCheckedChange={(v) => setForm({ ...form, is_pinned: v })}
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-red-100 p-4">
                <div>
                  <p className="text-sm font-medium flex items-center gap-2 text-red-700">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Mark as Urgent
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Highlighted in red — for emergencies only
                  </p>
                </div>
                <Switch
                  checked={form.is_urgent}
                  onCheckedChange={(v) => setForm({ ...form, is_urgent: v })}
                />
              </div>
            </div>

            {/* Preview */}
            {form.title && (
              <div className="rounded-xl bg-zinc-50 border p-4">
                <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">
                  Preview
                </p>
                <div className="flex items-start gap-2">
                  <span className="text-lg">
                    {CATEGORY_CONFIG[form.category]?.emoji}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{form.title}</p>
                    {form.content && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {form.content}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {form.is_pinned && (
                        <span className="text-xs text-zinc-500">📌 Pinned</span>
                      )}
                      {form.is_urgent && (
                        <span className="text-xs text-red-600 font-medium">
                          🚨 Urgent
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Bell className="h-4 w-4 mr-2" />
                    Post Notice
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── DELETE CONFIRMATION ───────────────────────────────── */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notice?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-zinc-900">
                &quot;{selectedNotice?.title}&quot;
              </span>
              ? This action cannot be undone and residents will no longer see
              this notice.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteNotice}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Notice
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
