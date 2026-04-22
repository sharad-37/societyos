// src/app/(dashboard)/resident/polls/page.tsx
"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Vote,
  CheckCircle,
  Clock,
  Lock,
  Users,
  ShieldCheck,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  hasVoted: boolean;
  userVoteOptionId: string | null;
  totalVotes: number;
  options: PollOption[];
}

export default function ResidentPollsPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [votingPollId, setVotingPollId] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/polls?status=ACTIVE");
      const data = await response.json();
      if (data.success) {
        setPolls(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch polls:", error);
      toast.error("Failed to load polls");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (pollId: string) => {
    const optionId = selectedOptions[pollId];
    if (!optionId) {
      toast.error("Please select an option before voting");
      return;
    }

    setVotingPollId(pollId);

    try {
      const response = await fetch(`/api/polls/${pollId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ option_id: optionId }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Your vote has been recorded! 🗳️");
        // Show vote hash for transparency
        if (data.data?.voteHash) {
          console.log("Vote Hash (tamper-proof):", data.data.voteHash);
        }
        fetchPolls(); // Refresh to show results
      } else {
        toast.error(data.message || "Failed to cast vote");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setVotingPollId(null);
    }
  };

  const getTimeRemaining = (endDate: string): string => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return "Ended";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  const getVotePercentage = (voteCount: number, totalVotes: number): number => {
    if (totalVotes === 0) return 0;
    return Math.round((voteCount / totalVotes) * 100);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Polls & Voting"
        description="Participate in society decisions"
        icon={Vote}
      />

      {/* Security Banner */}
      <div className="rounded-xl bg-zinc-950 p-4 flex items-center gap-3">
        <ShieldCheck className="h-5 w-5 text-green-400 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-white">
            Tamper-Evident Voting System
          </p>
          <p className="text-xs text-zinc-400 mt-0.5">
            Each vote is secured with SHA-256 hashing. One flat = One vote.
            Results are transparent.
          </p>
        </div>
      </div>

      {polls.length === 0 ? (
        <EmptyState
          icon={Vote}
          title="No active polls"
          description="Society polls will appear here when created by the committee"
        />
      ) : (
        <div className="space-y-6">
          {polls.map((poll) => {
            const isVoting = votingPollId === poll.id;
            const selectedOption = selectedOptions[poll.id];
            const timeRemaining = getTimeRemaining(poll.ends_at);
            const isPollEnded = new Date() > new Date(poll.ends_at);

            return (
              <Card
                key={poll.id}
                className={cn(
                  "overflow-hidden",
                  poll.hasVoted && "border-green-200",
                )}
              >
                {/* Poll Header */}
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base">
                          {poll.title}
                        </CardTitle>
                        {poll.is_anonymous && (
                          <Badge variant="secondary" className="text-xs">
                            <Lock className="h-2.5 w-2.5 mr-1" />
                            Anonymous
                          </Badge>
                        )}
                        {poll.hasVoted && (
                          <Badge className="bg-green-100 text-green-700 text-xs">
                            <CheckCircle className="h-2.5 w-2.5 mr-1" />
                            Voted
                          </Badge>
                        )}
                      </div>
                      {poll.description && (
                        <CardDescription className="mt-1">
                          {poll.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>

                  {/* Poll Meta */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {poll.totalVotes} vote
                      {poll.totalVotes !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {isPollEnded ? "Poll ended" : timeRemaining}
                    </span>
                    <span>Ends: {formatDate(poll.ends_at)}</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Options */}
                  {poll.options.map((option) => {
                    const percentage = getVotePercentage(
                      option.vote_count,
                      poll.totalVotes,
                    );
                    const isSelected = selectedOption === option.id;
                    const isVotedOption = poll.userVoteOptionId === option.id;
                    const showResults = poll.hasVoted || isPollEnded;

                    return (
                      <div key={option.id}>
                        {showResults ? (
                          // Show results after voting
                          <div
                            className={cn(
                              "rounded-xl border p-4 transition-all",
                              isVotedOption
                                ? "border-green-300 bg-green-50"
                                : "border-zinc-200 bg-zinc-50",
                            )}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {isVotedOption && (
                                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                )}
                                <span
                                  className={cn(
                                    "text-sm font-medium",
                                    isVotedOption
                                      ? "text-green-800"
                                      : "text-zinc-700",
                                  )}
                                >
                                  {option.option_text}
                                </span>
                              </div>
                              <span className="text-sm font-bold text-zinc-700">
                                {percentage}%
                              </span>
                            </div>
                            <Progress
                              value={percentage}
                              className={cn(
                                "h-2",
                                isVotedOption
                                  ? "[&>div]:bg-green-500"
                                  : "[&>div]:bg-zinc-400",
                              )}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              {option.vote_count} vote
                              {option.vote_count !== 1 ? "s" : ""}
                            </p>
                          </div>
                        ) : (
                          // Show voting options
                          <button
                            onClick={() =>
                              setSelectedOptions((prev) => ({
                                ...prev,
                                [poll.id]: option.id,
                              }))
                            }
                            className={cn(
                              "w-full text-left rounded-xl border-2 p-4",
                              "transition-all duration-150",
                              "hover:border-zinc-400 hover:bg-zinc-50",
                              isSelected
                                ? "border-zinc-900 bg-zinc-50 shadow-sm"
                                : "border-zinc-200",
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  "h-4 w-4 rounded-full border-2 flex-shrink-0 transition-all",
                                  isSelected
                                    ? "border-zinc-900 bg-zinc-900"
                                    : "border-zinc-300",
                                )}
                              >
                                {isSelected && (
                                  <div className="h-full w-full rounded-full flex items-center justify-center">
                                    <div className="h-1.5 w-1.5 rounded-full bg-white" />
                                  </div>
                                )}
                              </div>
                              <span className="text-sm font-medium">
                                {option.option_text}
                              </span>
                            </div>
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {/* Vote Button */}
                  {!poll.hasVoted && !isPollEnded && (
                    <Button
                      className="w-full mt-4"
                      onClick={() => handleVote(poll.id)}
                      disabled={!selectedOption || isVoting}
                      size="lg"
                    >
                      {isVoting ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Casting Vote...
                        </>
                      ) : (
                        <>
                          <Vote className="h-4 w-4 mr-2" />
                          Cast Vote
                        </>
                      )}
                    </Button>
                  )}

                  {poll.hasVoted && (
                    <div className="rounded-xl bg-green-50 border border-green-200 p-3 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <p className="text-sm text-green-700 font-medium">
                        Your vote has been recorded and secured with SHA-256
                        hashing
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
