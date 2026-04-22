// src/app/(dashboard)/committee/polls/page.tsx
"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Vote,
  Plus,
  Users,
  Clock,
  CheckCircle,
  BarChart3,
  Lock,
  Trash2,
  StopCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface PollOption {
  id: string;
  option_text: string;
  vote_count: number;
}

interface Poll {
  id: string;
  title: string;
  description: string | null;
  is_anonymous: boolean;
  status: string;
  starts_at: string;
  ends_at: string;
  totalVotes: number;
  options: PollOption[];
}

export default function CommitteePollsPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState("active");

  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    is_anonymous: false,
    starts_at: new Date().toISOString().slice(0, 16),
    ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 16),
    options: ["", ""],
  });

  useEffect(() => {
    fetchPolls();
  }, [activeTab]);

  const fetchPolls = async () => {
    setIsLoading(true);
    try {
      const status = activeTab === "active" ? "ACTIVE" : "CLOSED";
      const response = await fetch(`/api/polls?status=${status}&limit=20`);
      const data = await response.json();
      if (data.success) {
        setPolls(data.data || []);
      }
    } catch {
      toast.error("Failed to load polls");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddOption = () => {
    if (form.options.length < 10) {
      setForm({
        ...form,
        options: [...form.options, ""],
      });
    }
  };

  const handleRemoveOption = (index: number) => {
    if (form.options.length > 2) {
      const newOptions = form.options.filter((_, i) => i !== index);
      setForm({ ...form, options: newOptions });
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...form.options];
    newOptions[index] = value;
    setForm({ ...form, options: newOptions });
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate options
    const validOptions = form.options.filter((o) => o.trim().length > 0);
    if (validOptions.length < 2) {
      toast.error("At least 2 options are required");
      return;
    }

    if (!form.title.trim()) {
      toast.error("Poll title is required");
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          options: validOptions,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Poll created successfully! 🗳️");
        setShowCreateModal(false);
        setForm({
          title: "",
          description: "",
          is_anonymous: false,
          starts_at: new Date().toISOString().slice(0, 16),
          ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 16),
          options: ["", ""],
        });
        fetchPolls();
      } else {
        toast.error(data.message || "Failed to create poll");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleClosePoll = async (pollId: string) => {
    try {
      const response = await fetch(`/api/polls/${pollId}/close`, {
        method: "POST",
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Poll closed successfully");
        fetchPolls();
      } else {
        toast.error(data.message || "Failed to close poll");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const getVotePercentage = (count: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Polls Management"
        description="Create and manage society polls"
        icon={Vote}
        action={
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Poll
          </Button>
        }
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-xs grid-cols-2">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : polls.length === 0 ? (
            <EmptyState
              icon={Vote}
              title={
                activeTab === "active" ? "No active polls" : "No closed polls"
              }
              description={
                activeTab === "active"
                  ? "Create a poll to get resident feedback"
                  : "Closed polls will appear here"
              }
              action={
                activeTab === "active" ? (
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Poll
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="space-y-4">
              {polls.map((poll) => (
                <Card key={poll.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">
                            {poll.title}
                          </CardTitle>
                          {poll.is_anonymous && (
                            <Badge variant="secondary" className="text-xs">
                              <Lock className="h-2.5 w-2.5 mr-1" />
                              Anonymous
                            </Badge>
                          )}
                          <Badge
                            className={cn(
                              "text-xs",
                              poll.status === "ACTIVE"
                                ? "bg-green-100 text-green-700"
                                : "bg-zinc-100 text-zinc-700",
                            )}
                          >
                            {poll.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {poll.totalVotes} total votes
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Ends {formatDate(poll.ends_at)}
                          </span>
                        </div>
                      </div>

                      {poll.status === "ACTIVE" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => handleClosePoll(poll.id)}
                        >
                          <StopCircle className="h-3 w-3 mr-1" />
                          Close Poll
                        </Button>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-3">
                      {poll.options.map((option) => {
                        const pct = getVotePercentage(
                          option.vote_count,
                          poll.totalVotes,
                        );
                        return (
                          <div key={option.id}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm">
                                {option.option_text}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {option.vote_count} votes
                                </span>
                                <span className="text-sm font-bold">
                                  {pct}%
                                </span>
                              </div>
                            </div>
                            <Progress value={pct} className="h-2" />
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Poll Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Poll</DialogTitle>
            <DialogDescription>
              Create a poll for residents to vote on
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreatePoll} className="space-y-4 mt-2">
            {/* Title */}
            <div className="space-y-2">
              <Label>Poll Question *</Label>
              <Input
                placeholder="e.g. Should we install CCTV in parking area?"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Textarea
                placeholder="Additional context for voters..."
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: e.target.value,
                  })
                }
                rows={2}
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date & Time *</Label>
                <Input
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      starts_at: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>End Date & Time *</Label>
                <Input
                  type="datetime-local"
                  value={form.ends_at}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      ends_at: e.target.value,
                    })
                  }
                  required
                />
              </div>
            </div>

            {/* Options */}
            <div className="space-y-2">
              <Label>Options * (min 2, max 10)</Label>
              <div className="space-y-2">
                {form.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) =>
                        handleOptionChange(index, e.target.value)
                      }
                    />
                    {form.options.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-red-500 flex-shrink-0"
                        onClick={() => handleRemoveOption(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {form.options.length < 10 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddOption}
                  className="w-full mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Option
                </Button>
              )}
            </div>

            {/* Anonymous Toggle */}
            <div className="flex items-center justify-between rounded-xl border p-4">
              <div>
                <p className="text-sm font-medium">Anonymous Voting</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Hide voter identity from results
                </p>
              </div>
              <Switch
                checked={form.is_anonymous}
                onCheckedChange={(checked) =>
                  setForm({ ...form, is_anonymous: checked })
                }
              />
            </div>

            {/* Submit */}
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
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Vote className="h-4 w-4 mr-2" />
                    Create Poll
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
