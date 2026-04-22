// src/app/api/polls/[id]/vote/route.ts
import { NextRequest } from "next/server";
import { z } from "zod";
import { createHash } from "crypto";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-context";
import { createAuditLog, getRequestMeta } from "@/lib/audit";
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  forbiddenResponse,
  serverErrorResponse,
} from "@/lib/api-response";

const voteSchema = z.object({
  option_id: z.string().uuid("Invalid option ID"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: pollId } = await params;
  const { context, error } = requireAuth(request);
  if (error) return error;

  const { ipAddress, userAgent } = getRequestMeta(request);

  try {
    const body = await request.json();
    const validation = voteSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse("Invalid vote data", 400);
    }

    const { option_id } = validation.data;

    // ── 1. Get poll and validate ──────────────────────────────
    const poll = await prisma.poll.findFirst({
      where: {
        id: pollId,
        society_id: context!.societyId,
        deleted_at: null,
      },
      include: {
        options: true,
      },
    });

    if (!poll) return notFoundResponse("Poll");

    // Check poll is active
    if (poll.status !== "ACTIVE") {
      return forbiddenResponse("This poll is not active");
    }

    // Check poll dates
    const now = new Date();
    if (now < poll.starts_at) {
      return forbiddenResponse("This poll has not started yet");
    }
    if (now > poll.ends_at) {
      return forbiddenResponse("This poll has ended");
    }

    // ── 2. Validate option belongs to this poll ───────────────
    const optionExists = poll.options.find((o) => o.id === option_id);
    if (!optionExists) {
      return errorResponse("Invalid option for this poll", 400);
    }

    // ── 3. Check flat exists (needed for one-flat-one-vote) ───
    if (!context!.flatId) {
      return forbiddenResponse("You must be assigned to a flat to vote");
    }

    // ── 4. Check if flat already voted (ONE FLAT ONE VOTE) ────
    const existingVote = await prisma.vote.findUnique({
      where: {
        poll_id_flat_id: {
          poll_id: pollId,
          flat_id: context!.flatId,
        },
      },
    });

    if (existingVote) {
      return errorResponse(
        "Your flat has already voted in this poll. One flat, one vote.",
        409,
      );
    }

    // ── 5. Generate tamper-evident vote hash ──────────────────
    // Hash = SHA-256 of (pollId + flatId + optionId + timestamp)
    // This creates a unique fingerprint for each vote
    // Cannot be altered without changing the hash
    const timestamp = new Date().toISOString();
    const voteData = `${pollId}:${context!.flatId}:${option_id}:${timestamp}`;
    const voteHash = createHash("sha256").update(voteData).digest("hex");

    // ── 6. Record vote in transaction ─────────────────────────
    const vote = await prisma.$transaction(async (tx) => {
      // Create vote record
      const newVote = await tx.vote.create({
        data: {
          society_id: context!.societyId,
          poll_id: pollId,
          option_id,
          user_id: context!.userId,
          flat_id: context!.flatId!,
          vote_hash: voteHash,
          voted_at: new Date(timestamp),
        },
      });

      // Increment vote count on option
      await tx.pollOption.update({
        where: { id: option_id },
        data: { vote_count: { increment: 1 } },
      });

      return newVote;
    });

    // ── 7. Audit log ──────────────────────────────────────────
    await createAuditLog({
      societyId: context!.societyId,
      userId: poll.is_anonymous ? undefined : context!.userId,
      action: "CREATE",
      resource: "votes",
      resourceId: vote.id,
      newValues: {
        pollId,
        voteHash,
        // Only log option if not anonymous
        ...(!poll.is_anonymous && { optionId: option_id }),
      },
      ipAddress,
      userAgent,
    });

    return successResponse(
      {
        voteId: vote.id,
        voteHash,
        message: poll.is_anonymous
          ? "Your anonymous vote has been recorded"
          : "Your vote has been recorded",
      },
      "Vote cast successfully",
    );
  } catch (error) {
    return serverErrorResponse(error);
  }
}
