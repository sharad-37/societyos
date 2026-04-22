// src/app/(dashboard)/resident/notices/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Bell, Pin, AlertTriangle, Search, Clock, Tag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Pagination } from "@/components/shared/Pagination";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

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
  views: any[];
}

const CATEGORY_COLORS: Record<string, string> = {
  GENERAL: "bg-gray-100 text-gray-700",
  MAINTENANCE: "bg-blue-100 text-blue-700",
  MEETING: "bg-purple-100 text-purple-700",
  EMERGENCY: "bg-red-100 text-red-700",
  FINANCIAL: "bg-green-100 text-green-700",
  LEGAL: "bg-yellow-100 text-yellow-700",
  EVENT: "bg-pink-100 text-pink-700",
};

export default function ResidentNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchNotices();
  }, [categoryFilter, page]);

  const fetchNotices = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
        ...(categoryFilter !== "ALL" && { category: categoryFilter }),
      });

      const response = await fetch(`/api/notices?${params}`);
      const data = await response.json();

      if (data.success) {
        setNotices(data.data || []);
        setPagination({
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 1,
          hasNext: data.pagination?.hasNext || false,
          hasPrev: data.pagination?.hasPrev || false,
        });
      }
    } catch (error) {
      console.error("Failed to fetch notices:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter by search
  const filteredNotices = notices.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase()),
  );

  // Separate pinned notices
  const pinnedNotices = filteredNotices.filter((n) => n.is_pinned);
  const regularNotices = filteredNotices.filter((n) => !n.is_pinned);

  const NoticeCard = ({ notice }: { notice: Notice }) => {
    const isExpanded = expandedId === notice.id;
    const categoryColor =
      CATEGORY_COLORS[notice.category] || CATEGORY_COLORS.GENERAL;

    return (
      <Card
        className={cn(
          "cursor-pointer transition-all duration-200",
          "hover:shadow-md",
          notice.is_urgent && "border-red-200 bg-red-50/30",
          notice.is_pinned && "border-zinc-300",
        )}
        onClick={() => setExpandedId(isExpanded ? null : notice.id)}
      >
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* Icon */}
              <div
                className={cn(
                  "rounded-lg p-2 flex-shrink-0 mt-0.5",
                  notice.is_urgent ? "bg-red-100" : "bg-blue-100",
                )}
              >
                {notice.is_urgent ? (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                ) : (
                  <Bell className="h-4 w-4 text-blue-600" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-zinc-900">
                    {notice.title}
                  </h3>
                  {notice.is_pinned && (
                    <Pin className="h-3 w-3 text-zinc-500 flex-shrink-0" />
                  )}
                  {notice.is_urgent && (
                    <span className="inline-flex items-center rounded-full bg-red-100 border border-red-200 px-2 py-0.5 text-xs font-semibold text-red-700">
                      URGENT
                    </span>
                  )}
                </div>

                {/* Meta */}
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      categoryColor,
                    )}
                  >
                    <Tag className="h-2.5 w-2.5 mr-1" />
                    {notice.category}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDate(notice.created_at)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    By {notice.author?.full_name}
                  </span>
                </div>

                {/* Content Preview / Full */}
                <p
                  className={cn(
                    "mt-2 text-sm text-zinc-600 leading-relaxed",
                    isExpanded ? "" : "line-clamp-2",
                  )}
                >
                  {notice.content}
                </p>

                {notice.content.length > 150 && (
                  <button className="mt-1 text-xs text-zinc-500 hover:text-zinc-800 font-medium">
                    {isExpanded ? "Show less ↑" : "Read more ↓"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notice Board"
        description="Stay updated with society announcements"
        icon={Bell}
      />

      {/* Search + Filter Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notices..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={categoryFilter}
          onValueChange={(v) => {
            setCategoryFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Categories</SelectItem>
            <SelectItem value="GENERAL">General</SelectItem>
            <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
            <SelectItem value="MEETING">Meeting</SelectItem>
            <SelectItem value="EMERGENCY">Emergency</SelectItem>
            <SelectItem value="FINANCIAL">Financial</SelectItem>
            <SelectItem value="EVENT">Event</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredNotices.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notices found"
          description={
            search
              ? `No notices matching "${search}"`
              : "Society notices will appear here"
          }
        />
      ) : (
        <div className="space-y-6">
          {/* Pinned Notices */}
          {pinnedNotices.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Pin className="h-4 w-4 text-zinc-500" />
                <h2 className="text-sm font-semibold text-zinc-600 uppercase tracking-wider">
                  Pinned
                </h2>
              </div>
              <div className="space-y-3">
                {pinnedNotices.map((notice) => (
                  <NoticeCard key={notice.id} notice={notice} />
                ))}
              </div>
            </div>
          )}

          {/* Regular Notices */}
          {regularNotices.length > 0 && (
            <div>
              {pinnedNotices.length > 0 && (
                <h2 className="text-sm font-semibold text-zinc-600 uppercase tracking-wider mb-3">
                  All Notices
                </h2>
              )}
              <div className="space-y-3">
                {regularNotices.map((notice) => (
                  <NoticeCard key={notice.id} notice={notice} />
                ))}
              </div>
            </div>
          )}

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
    </div>
  );
}
