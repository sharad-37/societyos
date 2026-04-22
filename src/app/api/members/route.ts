// src/app/api/members/route.ts
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

// ─── GET — List All Members ───────────────────────────────────
export async function GET(request: NextRequest) {
  const { context, error } = requirePermission(request, "members:read");
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page")) || PAGINATION.defaultPage;
    const limit = Math.min(
      Number(searchParams.get("limit")) || PAGINATION.defaultLimit,
      PAGINATION.maxLimit,
    );
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";
    const skip = (page - 1) * limit;

    const whereClause: any = {
      society_id: context!.societyId,
      deleted_at: null,
      ...(role && { role }),
      ...(status && { status }),
      ...(search && {
        OR: [
          {
            full_name: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            email: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            phone: {
              contains: search,
            },
          },
        ],
      }),
    };

    const [members, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        include: {
          flat: {
            select: {
              flat_number: true,
              wing: true,
              floor: true,
              monthly_amount: true,
            },
          },
        },
        orderBy: [{ role: "asc" }, { full_name: "asc" }],
        skip,
        take: limit,
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    return paginatedResponse(
      members,
      {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
      "Members retrieved successfully",
    );
  } catch (error) {
    return serverErrorResponse(error);
  }
}

// ─── POST — Add New Member ────────────────────────────────────
const addMemberSchema = z.object({
  full_name: z.string().min(2).max(200),
  email: z.string().email(),
  phone: z.string().min(10).max(20).optional(),
  role: z.enum(["RESIDENT", "SECRETARY", "TREASURER", "PRESIDENT"]),
  flat_id: z.string().uuid().optional(),
  is_owner: z.boolean().default(true),
  move_in_date: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const { context, error } = requirePermission(request, "members:manage");
  if (error) return error;

  const { ipAddress, userAgent } = getRequestMeta(request);

  try {
    const body = await request.json();
    const validation = addMemberSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        "Invalid member data",
        400,
        validation.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }

    const data = validation.data;

    // Check if email already exists in this society
    const existing = await prisma.user.findFirst({
      where: {
        email: data.email,
        society_id: context!.societyId,
        deleted_at: null,
      },
    });

    if (existing) {
      return errorResponse(
        "A member with this email already exists in your society",
        409,
      );
    }

    // If flat_id provided, check flat belongs to society
    if (data.flat_id) {
      const flat = await prisma.flat.findFirst({
        where: {
          id: data.flat_id,
          society_id: context!.societyId,
          deleted_at: null,
        },
      });

      if (!flat) {
        return errorResponse("Invalid flat selected", 400);
      }
    }

    // Create member
    const member = await prisma.user.create({
      data: {
        society_id: context!.societyId,
        full_name: data.full_name,
        email: data.email.toLowerCase(),
        phone: data.phone,
        role: data.role,
        flat_id: data.flat_id || null,
        is_owner: data.is_owner,
        status: "ACTIVE",
        move_in_date: data.move_in_date ? new Date(data.move_in_date) : null,
      },
      include: {
        flat: {
          select: {
            flat_number: true,
            wing: true,
          },
        },
      },
    });

    await createAuditLog({
      societyId: context!.societyId,
      userId: context!.userId,
      action: "CREATE",
      resource: "users",
      resourceId: member.id,
      newValues: {
        email: data.email,
        role: data.role,
        full_name: data.full_name,
      },
      ipAddress,
      userAgent,
    });

    return createdResponse(
      member,
      `Member ${member.full_name} added successfully`,
    );
  } catch (error) {
    return serverErrorResponse(error);
  }
}
