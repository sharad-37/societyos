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
  Crown,
  Home,
  Mail,
  Phone,
  RefreshCw,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { PageHeader } from "@/components/shared/PageHeader";
import { Pagination } from "@/components/shared/Pagination";
import {
  AppleStatsCard,
  AppleAvatar,
  AppleCardSkeleton,
} from "@/components/ui/apple-components";
import { formatDateShort } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Flat {
  id: string;
  flat_number: string;
  wing: string | null;
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
  last_login_at: string | null;
  flat: { flat_number: string; wing: string | null } | null;
}

const ROLE_COLORS: Record<string, string> = {
  PRESIDENT: "bg-purple-100 text-purple-700",
  SECRETARY: "bg-blue-100 text-blue-700",
  TREASURER: "bg-green-100 text-green-700",
  RESIDENT: "bg-zinc-100 text-zinc-700",
};

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [stats, setStats] = useState({ total: 0, residents: 0, committee: 0 });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addForm, setAddForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    role: "RESIDENT",
    flat_id: "",
    is_owner: true,
    move_in_date: "",
  });
  const [editForm, setEditForm] = useState({
    full_name: "",
    phone: "",
    role: "",
    flat_id: "",
    status: "",
    is_owner: true,
  });

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchDebounced(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);
  useEffect(() => {
    fetchMembers();
  }, [roleFilter, searchDebounced, page]);
  useEffect(() => {
    fetchFlats();
  }, []);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "12",
        ...(roleFilter !== "ALL" && { role: roleFilter }),
        ...(searchDebounced && { search: searchDebounced }),
      });
      const res = await fetch(`/api/members?${params}`);
      const data = await res.json();
      if (data.success) {
        const all: Member[] = data.data || [];
        setMembers(all);
        setPagination({
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 1,
          hasNext: data.pagination?.hasNext || false,
          hasPrev: data.pagination?.hasPrev || false,
        });
        setStats({
          total: data.pagination?.total || 0,
          residents: all.filter((m) => m.role === "RESIDENT").length,
          committee: all.filter((m) =>
            ["PRESIDENT", "SECRETARY", "TREASURER"].includes(m.role),
          ).length,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFlats = async () => {
    try {
      const res = await fetch("/api/flats");
      const data = await res.json();
      if (data.success) setFlats(data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...addForm,
          flat_id: addForm.flat_id || undefined,
          move_in_date: addForm.move_in_date || undefined,
        }),
      });
      const data = await res.json();
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
      } else toast.error(data.message);
    } catch {
      toast.error("Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/members/${selectedMember.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          flat_id:
            editForm.flat_id === "none" ? null : editForm.flat_id || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Member updated");
        setShowEditModal(false);
        fetchMembers();
      } else toast.error(data.message);
    } catch {
      toast.error("Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMember) return;
    try {
      const res = await fetch(`/api/members/${selectedMember.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Member removed");
        setShowDeleteDialog(false);
        fetchMembers();
      } else toast.error(data.message);
    } catch {
      toast.error("Network error");
    }
  };

  const getFlatLabel = (flat: Flat) => {
    const label = flat.wing
      ? `${flat.wing}-${flat.flat_number}`
      : flat.flat_number;
    return (
      label +
      (flat.users.length > 0 ? ` (${flat.users[0].full_name})` : " (Vacant)")
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Member Management"
        description="Manage residents and committee members"
        icon={Users}
        action={
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <AppleStatsCard
          label="Total Members"
          value={pagination.total}
          icon={Users}
          iconColor="bg-blue-500"
          sublabel="In society"
        />
        <AppleStatsCard
          label="Residents"
          value={stats.residents}
          icon={Home}
          iconColor="bg-zinc-500"
          sublabel="Active"
        />
        <AppleStatsCard
          label="Committee"
          value={stats.committee}
          icon={Crown}
          iconColor="bg-purple-500"
          sublabel="Office bearers"
        />
      </div>

      <div className="apple-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Search members..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            value={roleFilter}
            onValueChange={(v) => {
              setRoleFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Roles</SelectItem>
              <SelectItem value="RESIDENT">Resident</SelectItem>
              <SelectItem value="SECRETARY">Secretary</SelectItem>
              <SelectItem value="TREASURER">Treasurer</SelectItem>
              <SelectItem value="PRESIDENT">President</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchMembers}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <AppleCardSkeleton key={i} />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="apple-card p-12 text-center">
          <Users className="h-8 w-8 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm text-zinc-400">
            {search ? `No members matching "${search}"` : "No members found"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => (
            <div key={member.id} className="apple-card p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <AppleAvatar name={member.full_name} size="md" />
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white leading-tight">
                      {member.full_name}
                    </p>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mt-1",
                        ROLE_COLORS[member.role] || ROLE_COLORS.RESIDENT,
                      )}
                    >
                      {member.role}
                    </span>
                  </div>
                </div>
                <span
                  className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full",
                    member.status === "ACTIVE"
                      ? "bg-green-100 text-green-700"
                      : "bg-zinc-100 text-zinc-500",
                  )}
                >
                  {member.status}
                </span>
              </div>
              <div className="space-y-1.5 mb-4">
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{member.email}</span>
                </div>
                {member.phone && (
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{member.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <Home className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>
                    {member.flat
                      ? `Flat ${member.flat.wing ? member.flat.wing + "-" : ""}${member.flat.flat_number}`
                      : "No flat"}
                  </span>
                </div>
                {!member.last_login_at && (
                  <div className="flex items-center gap-2 text-xs text-amber-600">
                    <UserCheck className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>Never logged in</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-700">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={() => {
                    setSelectedMember(member);
                    setEditForm({
                      full_name: member.full_name,
                      phone: member.phone || "",
                      role: member.role,
                      flat_id: "",
                      status: member.status,
                      is_owner: member.is_owner,
                    });
                    setShowEditModal(true);
                  }}
                >
                  <Edit2 className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => {
                    setSelectedMember(member);
                    setShowDeleteDialog(true);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
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
        limit={12}
      />

      {/* Add Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Member</DialogTitle>
            <DialogDescription>
              Add a resident or committee member
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input
                placeholder="Full name"
                value={addForm.full_name}
                onChange={(e) =>
                  setAddForm({ ...addForm, full_name: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={addForm.email}
                onChange={(e) =>
                  setAddForm({ ...addForm, email: e.target.value })
                }
                required
              />
              <p className="text-xs text-zinc-400">Used for OTP login</p>
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                placeholder="+91 98765 43210"
                value={addForm.phone}
                onChange={(e) =>
                  setAddForm({ ...addForm, phone: e.target.value })
                }
              />
            </div>
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
                <Label>Flat</Label>
                <Select
                  value={addForm.flat_id}
                  onValueChange={(v) => setAddForm({ ...addForm, flat_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select flat" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No flat</SelectItem>
                    {flats.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {getFlatLabel(f)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border p-4">
              <div>
                <p className="text-sm font-medium">Property Owner</p>
                <p className="text-xs text-zinc-400">Is this the owner?</p>
              </div>
              <Switch
                checked={addForm.is_owner}
                onCheckedChange={(v) => setAddForm({ ...addForm, is_owner: v })}
              />
            </div>
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
                {isSubmitting ? "Adding..." : "Add Member"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
            <DialogDescription>
              Update {selectedMember?.full_name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={editForm.full_name}
                onChange={(e) =>
                  setEditForm({ ...editForm, full_name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm({ ...editForm, phone: e.target.value })
                }
              />
            </div>
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
            <div className="flex items-center justify-between rounded-xl border p-4">
              <div>
                <p className="text-sm font-medium">Property Owner</p>
              </div>
              <Switch
                checked={editForm.is_owner}
                onCheckedChange={(v) =>
                  setEditForm({ ...editForm, is_owner: v })
                }
              />
            </div>
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

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove{" "}
              <span className="font-semibold">{selectedMember?.full_name}</span>{" "}
              from the society? Their historical data will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
