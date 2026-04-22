// src/app/api/complaints/route.ts
// GET  /api/complaints
// POST /api/complaints
// ============================================================

import { PAGINATION } from "@/constants/config";
import {
  createdResponse,
  errorResponse,
  paginatedResponse,
  serverErrorResponse,
} from "@/lib/api-response";
import { createAuditLog, getRequestMeta } from "@/lib/audit";
import { requireAuth, requirePermission } from "@/lib/auth-context";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import { z } from "zod";

// ─── Validation Schema ───────────────────────────────────────
const createComplaintSchema = z.object({
  category: z.enum([
    "PLUMBING",
    "ELECTRICAL",
    "CLEANING",
    "SECURITY",
    "LIFT",
    "PARKING",
    "NOISE",
    "INTERNET",
    "GAS",
    "OTHER",
  ]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  title: z.string().min(10, "Title must be at least 10 characters").max(300),
  description: z
    .string()
    .min(20, "Please provide more detail (min 20 characters)")
    .max(2000),
  location: z.string().max(200).optional(),
});

// ─── GET ─────────────────────────────────────────────────────
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
    const category = searchParams.get("category");
    const priority = searchParams.get("priority");

    const isCommittee = [
      "SECRETARY",
      "TREASURER",
      "PRESIDENT",
      "ADMIN",
    ].includes(context!.role);

    const whereClause: any = {
      society_id: context!.societyId,
      deleted_at: null,
      ...(!isCommittee && { raised_by: context!.userId }),
      ...(status && { status }),
      ...(category && { category }),
      ...(priority && { priority }),
    };

    const skip = (page - 1) * limit;

    const [complaints, total] = await Promise.all([
      prisma.complaint.findMany({
        where: whereClause,
        include: {
          raised_by_user: {
            select: {
              full_name: true,
              flat: { select: { flat_number: true } },
            },
          },
          assigned_to_user: { select: { full_name: true } },
          updates: {
            orderBy: { created_at: "desc" },
            take: 1,
          },
        },
        orderBy: [{ priority: "desc" }, { created_at: "desc" }],
        skip,
        take: limit,
      }),
      prisma.complaint.count({ where: whereClause }),
    ]);

    return paginatedResponse(
      complaints,
      {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
      "Complaints retrieved successfully",
    );
  } catch (error) {
    return serverErrorResponse(error);
  }
}

// ─── POST ────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const { context, error } = requirePermission(request, "complaints:create");
  if (error) return error;

  const { ipAddress, userAgent } = getRequestMeta(request);

  try {
    const body = await request.json();
    const validation = createComplaintSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        "Invalid complaint data",
        400,
        validation.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }

    // Generate complaint number
    const count = await prisma.complaint.count({
      where: { society_id: context!.societyId },
    });
    const complaintNumber = `COMP-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const complaint = await prisma.complaint.create({
      data: {
        society_id: context!.societyId,
        raised_by: context!.userId,
        complaint_number: complaintNumber,
        ...validation.data,
        status: "OPEN",
      },
      include: {
        raised_by_user: {
          select: { full_name: true, email: true },
        },
      },
    });

    await createAuditLog({
      societyId: context!.societyId,
      userId: context!.userId,
      action: "CREATE",
      resource: "complaints",
      resourceId: complaint.id,
      newValues: validation.data,
      ipAddress,
      userAgent,
    });

    return createdResponse(
      complaint,
      `Complaint ${complaintNumber} raised successfully`,
    );
  } catch (error) {
    return serverErrorResponse(error);
  }
}
