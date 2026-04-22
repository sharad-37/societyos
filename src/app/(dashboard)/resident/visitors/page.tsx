// src/app/(dashboard)/resident/visitors/page.tsx
"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Users,
  Plus,
  Copy,
  CheckCircle,
  Clock,
  X,
  Shield,
  Phone,
  QrCode,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { Pagination } from "@/components/shared/Pagination";
import { formatDate, formatDateShort } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Visitor {
  id: string;
  visitor_name: string;
  visitor_phone: string;
  purpose: string | null;
  otp_code: string;
  status: string;
  valid_from: string;
  valid_until: string;
  checked_in_at: string | null;
  checked_out_at: string | null;
}

interface NewVisitorPass {
  visitor_name: string;
  otp_code: string;
  valid_until: string;
  status: string;
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700 border-green-200",
  EXPIRED: "bg-zinc-100 text-zinc-500 border-zinc-200",
  USED: "bg-blue-100 text-blue-700 border-blue-200",
  CANCELLED: "bg-red-100 text-red-700 border-red-200",
};

export default function VisitorManagementPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newPass, setNewPass] = useState<NewVisitorPass | null>(null);
  const [showPassModal, setShowPassModal] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [copied, setCopied] = useState(false);

  // Form
  const [form, setForm] = useState({
    visitor_name: "",
    visitor_phone: "",
    purpose: "",
    valid_hours: "24",
  });

  useEffect(() => {
    fetchVisitors();
  }, [page]);

  const fetchVisitors = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/visitors?page=${page}&limit=10`);
      const data = await response.json();
      if (data.success) {
        setVisitors(data.data || []);
        setPagination({
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 1,
          hasNext: data.pagination?.hasNext || false,
          hasPrev: data.pagination?.hasPrev || false,
        });
      }
    } catch {
      toast.error("Failed to load visitors");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePass = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.visitor_name || !form.visitor_phone) {
      toast.error("Name and phone are required");
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch("/api/visitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          valid_hours: parseInt(form.valid_hours),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setNewPass(data.data);
        setShowCreateModal(false);
        setShowPassModal(true);
        setForm({
          visitor_name: "",
          visitor_phone: "",
          purpose: "",
          valid_hours: "24",
        });
        fetchVisitors();
      } else {
        toast.error(data.message || "Failed to create visitor pass");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyOTP = (otp: string) => {
    navigator.clipboard.writeText(otp);
    setCopied(true);
    toast.success("OTP copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const getTimeRemaining = (validUntil: string): string => {
    const now = new Date();
    const until = new Date(validUntil);
    const diff = until.getTime() - now.getTime();

    if (diff <= 0) return "Expired";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visitor Management"
        description="Generate OTP passes for your guests"
        icon={Users}
        action={
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Visitor Pass
          </Button>
        }
      />

      {/* How it works banner */}
      <div className="rounded-xl border bg-zinc-50 p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-zinc-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-zinc-800">
              How Visitor OTP Works
            </p>
            <div className="mt-1 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-zinc-600">
              <div className="flex items-center gap-1">
                <span className="font-bold text-zinc-900">1.</span>
                Generate OTP pass for your guest
              </div>
              <div className="flex items-center gap-1">
                <span className="font-bold text-zinc-900">2.</span>
                Share 6-digit code with visitor
              </div>
              <div className="flex items-center gap-1">
                <span className="font-bold text-zinc-900">3.</span>
                Guard verifies code at gate
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visitors List */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : visitors.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No visitor passes"
          description="Generate OTP passes for your guests to enter the society"
          action={
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Pass
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {visitors.map((visitor) => (
            <Card
              key={visitor.id}
              className={cn(
                "overflow-hidden",
                visitor.status === "ACTIVE" && "border-green-200",
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className={cn(
                        "rounded-full p-2.5 flex-shrink-0",
                        visitor.status === "ACTIVE"
                          ? "bg-green-100"
                          : "bg-zinc-100",
                      )}
                    >
                      <Users
                        className={cn(
                          "h-4 w-4",
                          visitor.status === "ACTIVE"
                            ? "text-green-600"
                            : "text-zinc-500",
                        )}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold">
                          {visitor.visitor_name}
                        </p>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold",
                            STATUS_STYLES[visitor.status] ||
                              "bg-zinc-100 text-zinc-600",
                          )}
                        >
                          {visitor.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {visitor.visitor_phone}
                        </span>
                        {visitor.purpose && <span>• {visitor.purpose}</span>}
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {visitor.status === "ACTIVE"
                            ? getTimeRemaining(visitor.valid_until)
                            : formatDateShort(visitor.valid_until)}
                        </span>
                        {visitor.checked_in_at && (
                          <span className="text-green-600 font-medium">
                            ✓ Checked in{" "}
                            {formatDateShort(visitor.checked_in_at)}
                          </span>
                        )}
                        {visitor.checked_out_at && (
                          <span className="text-zinc-500">
                            ✓ Checked out{" "}
                            {formatDateShort(visitor.checked_out_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* OTP Display */}
                  {visitor.status === "ACTIVE" && (
                    <div className="flex-shrink-0 text-right">
                      <div className="rounded-xl bg-zinc-950 px-4 py-2 text-center">
                        <p className="text-xs text-zinc-400 mb-1">Gate OTP</p>
                        <p className="text-lg font-black text-white font-mono tracking-widest">
                          {visitor.otp_code}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-1 h-7 text-xs w-full"
                        onClick={() => handleCopyOTP(visitor.otp_code)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

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

      {/* Create Pass Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Visitor Pass</DialogTitle>
            <DialogDescription>
              Generate a secure OTP pass for your guest
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreatePass} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Visitor Name *</Label>
              <Input
                placeholder="Full name of visitor"
                value={form.visitor_name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    visitor_name: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Visitor Phone *</Label>
              <Input
                placeholder="+91 98765 43210"
                value={form.visitor_phone}
                onChange={(e) =>
                  setForm({
                    ...form,
                    visitor_phone: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Purpose of Visit</Label>
              <Input
                placeholder="e.g. Delivery, Family visit, Work"
                value={form.purpose}
                onChange={(e) =>
                  setForm({
                    ...form,
                    purpose: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Valid For</Label>
              <Select
                value={form.valid_hours}
                onValueChange={(v) => setForm({ ...form, valid_hours: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 hours</SelectItem>
                  <SelectItem value="6">6 hours</SelectItem>
                  <SelectItem value="12">12 hours</SelectItem>
                  <SelectItem value="24">24 hours</SelectItem>
                  <SelectItem value="48">48 hours</SelectItem>
                  <SelectItem value="72">72 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isCreating}>
                {isCreating ? (
                  "Generating..."
                ) : (
                  <>
                    <QrCode className="h-4 w-4 mr-2" />
                    Generate Pass
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Show OTP Pass Modal */}
      <Dialog open={showPassModal} onOpenChange={setShowPassModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">
              Visitor Pass Created! 🎉
            </DialogTitle>
          </DialogHeader>

          {newPass && (
            <div className="space-y-4 mt-2">
              <p className="text-center text-sm text-muted-foreground">
                Share this OTP with{" "}
                <span className="font-semibold text-zinc-900">
                  {newPass.visitor_name}
                </span>
              </p>

              {/* Big OTP Display */}
              <div className="rounded-2xl bg-zinc-950 p-6 text-center">
                <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">
                  Gate Entry OTP
                </p>
                <p className="text-5xl font-black text-white font-mono tracking-[0.3em]">
                  {newPass.otp_code}
                </p>
                <p className="text-xs text-zinc-400 mt-3">
                  Valid until: {formatDate(newPass.valid_until)}
                </p>
              </div>

              {/* Copy Button */}
              <Button
                className="w-full"
                onClick={() => handleCopyOTP(newPass.otp_code)}
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy OTP Code
                  </>
                )}
              </Button>

              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    Ask your visitor to show this code to the security guard at
                    the gate. The guard will scan and verify it.
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowPassModal(false)}
              >
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
