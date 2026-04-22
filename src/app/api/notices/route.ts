// src/app/api/notices/route.ts
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

// ─── GET — List Notices ──────────────────────────────────────
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
    const category = searchParams.get("category");
    const skip = (page - 1) * limit;

    const whereClause: any = {
      society_id: context!.societyId,
      deleted_at: null,
      ...(category && { category }),
    };

    const [notices, total] = await Promise.all([
      prisma.notice.findMany({
        where: whereClause,
        include: {
          author: {
            select: { full_name: true },
          },
          views: {
            where: { user_id: context!.userId },
            select: { id: true },
          },
        },
        orderBy: [
          { is_pinned: "desc" },
          { is_urgent: "desc" },
          { created_at: "desc" },
        ],
        skip,
        take: limit,
      }),
      prisma.notice.count({ where: whereClause }),
    ]);

    // Mark notices as viewed
    const unviewedIds = notices
      .filter((n) => n.views.length === 0)
      .map((n) => n.id);

    if (unviewedIds.length > 0) {
      await prisma.noticeView.createMany({
        data: unviewedIds.map((noticeId) => ({
          notice_id: noticeId,
          user_id: context!.userId,
        })),
        skipDuplicates: true,
      });
    }

    return paginatedResponse(
      notices,
      {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
      "Notices retrieved successfully",
    );
  } catch (error) {
    return serverErrorResponse(error);
  }
}

// ─── POST — Create Notice ─────────────────────────────────────
const createNoticeSchema = z.object({
  title: z.string().min(5).max(300),
  content: z.string().min(10),
  category: z.enum([
    "GENERAL",
    "MAINTENANCE",
    "MEETING",
    "EMERGENCY",
    "FINANCIAL",
    "LEGAL",
    "EVENT",
  ]),
  is_pinned: z.boolean().default(false),
  is_urgent: z.boolean().default(false),
  expires_at: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const { context, error } = requirePermission(request, "notices:create");
  if (error) return error;

  const { ipAddress, userAgent } = getRequestMeta(request);

  try {
    const body = await request.json();
    const validation = createNoticeSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        "Invalid notice data",
        400,
        validation.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }

    const notice = await prisma.notice.create({
      data: {
        society_id: context!.societyId,
        created_by: context!.userId,
        ...validation.data,
        expires_at: validation.data.expires_at
          ? new Date(validation.data.expires_at)
          : null,
      },
      include: {
        author: { select: { full_name: true } },
      },
    });

    await createAuditLog({
      societyId: context!.societyId,
      userId: context!.userId,
      action: "CREATE",
      resource: "notices",
      resourceId: notice.id,
      ipAddress,
      userAgent,
    });

    return createdResponse(notice, "Notice posted successfully");
  } catch (error) {
    return serverErrorResponse(error);
  }
}
