// src/app/api/polls/route.ts
import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAuth, requirePermission } from "@/lib/auth-context";
import { createAuditLog, getRequestMeta } from "@/lib/audit";
import {
  paginatedResponse,
  createdResponse,
  errorResponse,
  serverErrorResponse,
} from "@/lib/api-response";
import { PAGINATION } from "@/constants/config";

// ─── GET — List Polls ─────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { context, error } = requireAuth(request);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page")) || PAGINATION.defaultPage;
    const limit = Math.min(
      Number(searchParams.get("limit")) || PAGINATION.defaultLimit,
      PAGINATION.maxLimit,
    );
    const status = searchParams.get("status");
    const skip = (page - 1) * limit;

    const whereClause: any = {
      society_id: context!.societyId,
      deleted_at: null,
      ...(status && { status }),
    };

    const [polls, total] = await Promise.all([
      prisma.poll.findMany({
        where: whereClause,
        include: {
          options: {
            orderBy: { vote_count: "desc" },
          },
          votes: {
            where: { flat_id: context!.flatId ?? "" },
            select: { id: true, option_id: true },
          },
          _count: {
            select: { votes: true },
          },
        },
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      prisma.poll.count({ where: whereClause }),
    ]);

    // Add hasVoted flag for each poll
    const pollsWithVoteStatus = polls.map((poll) => ({
      ...poll,
      hasVoted: poll.votes.length > 0,
      userVoteOptionId: poll.votes[0]?.option_id ?? null,
      totalVotes: poll._count.votes,
    }));

    return paginatedResponse(
      pollsWithVoteStatus,
      {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
      "Polls retrieved successfully",
    );
  } catch (error) {
    return serverErrorResponse(error);
  }
}

// ─── POST — Create Poll ───────────────────────────────────────
const createPollSchema = z.object({
  title: z.string().min(5).max(300),
  description: z.string().optional(),
  is_anonymous: z.boolean().default(false),
  starts_at: z.string(),
  ends_at: z.string(),
  options: z
    .array(z.string().min(1).max(300))
    .min(2, "At least 2 options required")
    .max(10, "Maximum 10 options allowed"),
});

export async function POST(request: NextRequest) {
  const { context, error } = requirePermission(request, "polls:create");
  if (error) return error;

  const { ipAddress, userAgent } = getRequestMeta(request);

  try {
    const body = await request.json();
    const validation = createPollSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        "Invalid poll data",
        400,
        validation.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }

    const { options, ...pollData } = validation.data;

    // Validate dates
    const startsAt = new Date(pollData.starts_at);
    const endsAt = new Date(pollData.ends_at);

    if (endsAt <= startsAt) {
      return errorResponse("End date must be after start date", 400);
    }

    // Create poll with options in transaction
    const poll = await prisma.$transaction(async (tx) => {
      const newPoll = await tx.poll.create({
        data: {
          society_id: context!.societyId,
          created_by: context!.userId,
          title: pollData.title,
          description: pollData.description,
          is_anonymous: pollData.is_anonymous,
          starts_at: startsAt,
          ends_at: endsAt,
          status: "ACTIVE",
        },
      });

      // Create poll options
      await tx.pollOption.createMany({
        data: options.map((text) => ({
          poll_id: newPoll.id,
          option_text: text,
          vote_count: 0,
        })),
      });

      return tx.poll.findUnique({
        where: { id: newPoll.id },
        include: { options: true },
      });
    });

    await createAuditLog({
      societyId: context!.societyId,
      userId: context!.userId,
      action: "CREATE",
      resource: "polls",
      resourceId: poll?.id,
      newValues: { title: pollData.title },
      ipAddress,
      userAgent,
    });

    return createdResponse(poll, "Poll created successfully");
  } catch (error) {
    return serverErrorResponse(error);
  }
}
