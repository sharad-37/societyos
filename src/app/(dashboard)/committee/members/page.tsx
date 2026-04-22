// src/app/(dashboard)/committee/members/page.tsx
"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Shield,
  Home,
  Mail,
  Phone,
  RefreshCw,
  Crown,
  UserCheck,
  UserX,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatsCard } from "@/components/shared/StatsCard";
import { Pagination } from "@/components/shared/Pagination";
import { getInitials, formatDateShort } from "@/lib/utils";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────
interface Flat {
  id: string;
  flat_number: string;
  wing: string | null;
  floor: number;
  monthly_amount: string;
  users: { id: string; full_name: string }[];
}

interface Member {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  is_owner: boolean;
  move_in_date: string | null;
  last_login_at: string | null;
  flat: {
    flat_number: string;
    wing: string | null;
  } | null;
}

// ─── Constants ────────────────────────────────────────────────
const ROLE_CONFIG: Record<string, { label: string; color: string; icon: any }> =
  {
    PRESIDENT: {
      label: "President",
      color: "bg-purple-100 text-purple-700 border-purple-200",
      icon: Crown,
    },
    SECRETARY: {
      label: "Secretary",
      color: "bg-blue-100 text-blue-700 border-blue-200",
      icon: Shield,
    },
    TREASURER: {
      label: "Treasurer",
      color: "bg-green-100 text-green-700 border-green-200",
      icon: UserCheck,
    },
    RESIDENT: {
      label: "Resident",
      color: "bg-zinc-100 text-zinc-700 border-zinc-200",
      icon: Home,
    },
  };

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  ACTIVE: {
    label: "Active",
    color: "bg-green-100 text-green-700",
  },
  INACTIVE: {
    label: "Inactive",
    color: "bg-zinc-100 text-zinc-500",
  },
  SUSPENDED: {
    label: "Suspended",
    color: "bg-red-100 text-red-700",
  },
  PENDING_VERIFICATION: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-700",
  },
};

// ─── Component ────────────────────────────────────────────────
export default function MembersPage() {
  // ── State ──────────────────────────────────────────────────
  const [members, setMembers] = useState<Member[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [stats, setStats] = useState({
    total: 0,
    residents: 0,
    committee: 0,
    inactive: 0,
  });

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add form
  const [addForm, setAddForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    role: "RESIDENT",
    flat_id: "",
    is_owner: true,
    move_in_date: "",
  });

  // Edit form
  const [editForm, setEditForm] = useState({
    full_name: "",
    phone: "",
    role: "",
    flat_id: "",
    status: "",
    is_owner: true,
  });

  // ── Search Debounce ────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // ── Effects ────────────────────────────────────────────────
  useEffect(() => {
    fetchMembers();
  }, [roleFilter, statusFilter, searchDebounced, page]);

  useEffect(() => {
    fetchFlats();
  }, []);

  // ── Data Fetching ──────────────────────────────────────────
  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "12",
        ...(roleFilter !== "ALL" && { role: roleFilter }),
        ...(statusFilter !== "ALL" && {
          status: statusFilter,
        }),
        ...(searchDebounced && { search: searchDebounced }),
      });

      const response = await fetch(`/api/members?${params}`);
      const data = await response.json();

      if (data.success) {
        const allMembers: Member[] = data.data || [];
        setMembers(allMembers);
        setPagination({
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 1,
          hasNext: data.pagination?.hasNext || false,
          hasPrev: data.pagination?.hasPrev || false,
        });

        setStats({
          total: data.pagination?.total || 0,
          residents: allMembers.filter((m) => m.role === "RESIDENT").length,
          committee: allMembers.filter((m) =>
            ["PRESIDENT", "SECRETARY", "TREASURER"].includes(m.role),
          ).length,
          inactive: allMembers.filter((m) => m.status !== "ACTIVE").length,
        });
      }
    } catch (error) {
      toast.error("Failed to load members");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFlats = async () => {
    try {
      const response = await fetch("/api/flats");
      const data = await response.json();
      if (data.success) {
        setFlats(data.data || []);
      }
    } catch {
      console.error("Failed to fetch flats");
    }
  };

  // ── Handlers ───────────────────────────────────────────────
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...addForm,
          flat_id: addForm.flat_id || undefined,
          move_in_date: addForm.move_in_date || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        setShowAddModal(false);
        setAddForm({
          full_name: "",
          email: "",
          phone: "",
          role: "RESIDENT",
          flat_id: "",
          is_owner: true,
          move_in_date: "",
        });
        fetchMembers();
      } else {
        toast.error(data.message || "Failed to add member");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/members/${selectedMember.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          flat_id:
            editForm.flat_id === "none" ? null : editForm.flat_id || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Member updated successfully");
        setShowEditModal(false);
        setSelectedMember(null);
        fetchMembers();
      } else {
        toast.error(data.message || "Failed to update member");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!selectedMember) return;

    try {
      const response = await fetch(`/api/members/${selectedMember.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Member removed successfully");
        setShowDeleteDialog(false);
        setSelectedMember(null);
        fetchMembers();
      } else {
        toast.error(data.message || "Failed to remove member");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const openEditModal = (member: Member) => {
    setSelectedMember(member);
    setEditForm({
      full_name: member.full_name,
      phone: member.phone || "",
      role: member.role,
      flat_id: member.flat
        ? flats.find((f) => f.flat_number === member.flat?.flat_number)?.id ||
          ""
        : "",
      status: member.status,
      is_owner: member.is_owner,
    });
    setShowEditModal(true);
  };

  const openDeleteDialog = (member: Member) => {
    setSelectedMember(member);
    setShowDeleteDialog(true);
  };

  // ── Helper: Get flat display name ──────────────────────────
  const getFlatLabel = (flat: Flat) => {
    const label = flat.wing
      ? `${flat.wing}-${flat.flat_number}`
      : flat.flat_number;
    const occupied =
      flat.users.length > 0 ? ` (${flat.users[0].full_name})` : " (Vacant)";
    return label + occupied;
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Member Management"
        description="Manage society residents and committee members"
        icon={Users}
        action={
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        }
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatsCard
          title="Total Members"
          value={pagination.total}
          icon={Users}
          color="blue"
          subtitle="In society"
        />
        <StatsCard
          title="Residents"
          value={stats.residents}
          icon={Home}
          color="default"
          subtitle="Active residents"
        />
        <StatsCard
          title="Committee"
          value={stats.committee}
          icon={Crown}
          color="yellow"
          subtitle="Office bearers"
        />
        <StatsCard
          title="Inactive"
          value={stats.inactive}
          icon={UserX}
          color={stats.inactive > 0 ? "red" : "green"}
          subtitle="Need attention"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email or phone..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Role Filter */}
            <Select
              value={roleFilter}
              onValueChange={(v) => {
                setRoleFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value="RESIDENT">Resident</SelectItem>
                <SelectItem value="SECRETARY">Secretary</SelectItem>
                <SelectItem value="TREASURER">Treasurer</SelectItem>
                <SelectItem value="PRESIDENT">President</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
              </SelectContent>
            </Select>

            {/* Refresh */}
            <Button
              variant="outline"
              onClick={() => fetchMembers()}
              className="w-full sm:w-auto"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Members Grid */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No members found"
          description={
            search
              ? `No members matching "${search}"`
              : "Add members to your society to get started"
          }
          action={
            !search ? (
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Member
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((member) => {
              const roleConfig =
                ROLE_CONFIG[member.role] || ROLE_CONFIG.RESIDENT;
              const statusConfig =
                STATUS_CONFIG[member.status] || STATUS_CONFIG.ACTIVE;
              const RoleIcon = roleConfig.icon;

              return (
                <Card
                  key={member.id}
                  className={cn(
                    "hover:shadow-md transition-shadow",
                    member.status !== "ACTIVE" && "opacity-70",
                  )}
                >
                  <CardContent className="p-5">
                    {/* Header Row */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="h-11 w-11 rounded-full bg-zinc-900 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-white">
                            {getInitials(member.full_name)}
                          </span>
                        </div>

                        {/* Name + Role */}
                        <div>
                          <p className="text-sm font-semibold text-zinc-900 leading-tight">
                            {member.full_name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
                                roleConfig.color,
                              )}
                            >
                              <RoleIcon className="h-2.5 w-2.5" />
                              {roleConfig.label}
                            </span>
                            {member.is_owner && (
                              <span className="text-xs text-muted-foreground">
                                Owner
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          statusConfig.color,
                        )}
                      >
                        {statusConfig.label}
                      </span>
                    </div>

                    {/* Info Grid */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{member.email}</span>
                      </div>

                      {member.phone && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>{member.phone}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Home className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>
                          {member.flat
                            ? `Flat ${member.flat.wing ? member.flat.wing + "-" : ""}${member.flat.flat_number}`
                            : "No flat assigned"}
                        </span>
                      </div>

                      {member.last_login_at && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <UserCheck className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>
                            Last login: {formatDateShort(member.last_login_at)}
                          </span>
                        </div>
                      )}

                      {!member.last_login_at && (
                        <div className="flex items-center gap-2 text-xs text-amber-600">
                          <UserX className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>Never logged in</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={() => openEditModal(member)}
                      >
                        <Edit2 className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => openDeleteDialog(member)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          <Pagination
            page={page}
            totalPages={pagination.totalPages}
            hasNext={pagination.hasNext}
            hasPrev={pagination.hasPrev}
            onNext={() => setPage(page + 1)}
            onPrev={() => setPage(page - 1)}
            total={pagination.total}
            limit={12}
          />
        </>
      )}

      {/* ── ADD MEMBER MODAL ─────────────────────────────────── */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Member</DialogTitle>
            <DialogDescription>
              Add a new resident or committee member to your society
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddMember} className="space-y-4 mt-2">
            {/* Full Name */}
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input
                placeholder="e.g. Ramesh Kumar Sharma"
                value={addForm.full_name}
                onChange={(e) =>
                  setAddForm({
                    ...addForm,
                    full_name: e.target.value,
                  })
                }
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label>Email Address *</Label>
              <Input
                type="email"
                placeholder="member@example.com"
                value={addForm.email}
                onChange={(e) =>
                  setAddForm({
                    ...addForm,
                    email: e.target.value,
                  })
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                Member will use this email to login via OTP
              </p>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                placeholder="+91 98765 43210"
                value={addForm.phone}
                onChange={(e) =>
                  setAddForm({
                    ...addForm,
                    phone: e.target.value,
                  })
                }
              />
            </div>

            {/* Role + Flat Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role *</Label>
                <Select
                  value={addForm.role}
                  onValueChange={(v) => setAddForm({ ...addForm, role: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RESIDENT">Resident</SelectItem>
                    <SelectItem value="SECRETARY">Secretary</SelectItem>
                    <SelectItem value="TREASURER">Treasurer</SelectItem>
                    <SelectItem value="PRESIDENT">President</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Assign Flat</Label>
                <Select
                  value={addForm.flat_id}
                  onValueChange={(v) => setAddForm({ ...addForm, flat_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select flat" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No flat</SelectItem>
                    {flats.map((flat) => (
                      <SelectItem key={flat.id} value={flat.id}>
                        {getFlatLabel(flat)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Move In Date */}
            <div className="space-y-2">
              <Label>Move-in Date</Label>
              <Input
                type="date"
                value={addForm.move_in_date}
                onChange={(e) =>
                  setAddForm({
                    ...addForm,
                    move_in_date: e.target.value,
                  })
                }
              />
            </div>

            {/* Is Owner Toggle */}
            <div className="flex items-center justify-between rounded-xl border p-4">
              <div>
                <p className="text-sm font-medium">Property Owner</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Is this person the owner of the flat?
                </p>
              </div>
              <Switch
                checked={addForm.is_owner}
                onCheckedChange={(v) => setAddForm({ ...addForm, is_owner: v })}
              />
            </div>

            {/* Submit Buttons */}
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
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Member
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── EDIT MEMBER MODAL ────────────────────────────────── */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
            <DialogDescription>
              Update details for{" "}
              <span className="font-semibold">{selectedMember?.full_name}</span>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditMember} className="space-y-4 mt-2">
            {/* Full Name */}
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={editForm.full_name}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    full_name: e.target.value,
                  })
                }
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    phone: e.target.value,
                  })
                }
              />
            </div>

            {/* Role + Status Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={editForm.role}
                  onValueChange={(v) => setEditForm({ ...editForm, role: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RESIDENT">Resident</SelectItem>
                    <SelectItem value="SECRETARY">Secretary</SelectItem>
                    <SelectItem value="TREASURER">Treasurer</SelectItem>
                    <SelectItem value="PRESIDENT">President</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(v) => setEditForm({ ...editForm, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Flat Assignment */}
            <div className="space-y-2">
              <Label>Assigned Flat</Label>
              <Select
                value={editForm.flat_id || "none"}
                onValueChange={(v) => setEditForm({ ...editForm, flat_id: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No flat assigned</SelectItem>
                  {flats.map((flat) => (
                    <SelectItem key={flat.id} value={flat.id}>
                      {getFlatLabel(flat)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Owner Toggle */}
            <div className="flex items-center justify-between rounded-xl border p-4">
              <div>
                <p className="text-sm font-medium">Property Owner</p>
                <p className="text-xs text-muted-foreground">
                  Toggle if ownership status changed
                </p>
              </div>
              <Switch
                checked={editForm.is_owner}
                onCheckedChange={(v) =>
                  setEditForm({ ...editForm, is_owner: v })
                }
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── DELETE CONFIRMATION ───────────────────────────────── */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-semibold text-zinc-900">
                {selectedMember?.full_name}
              </span>{" "}
              from the society?
              <br />
              <br />
              This will deactivate their account and they will no longer be able
              to login. Their historical data (bills, complaints) will be
              preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMember}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
