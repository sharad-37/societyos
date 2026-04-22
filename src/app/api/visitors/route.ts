// src/app/api/visitors/route.ts
import { NextRequest } from "next/server";
import { z } from "zod";
import { createHash } from "crypto";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-context";
import { createAuditLog, getRequestMeta } from "@/lib/audit";
import {
  paginatedResponse,
  createdResponse,
  errorResponse,
  serverErrorResponse,
} from "@/lib/api-response";
import { PAGINATION } from "@/constants/config";

// ─── Generate OTP Pass ────────────────────────────────────────
function generateVisitorOTP(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let otp = "";
  for (let i = 0; i < 6; i++) {
    otp += chars[Math.floor(Math.random() * chars.length)];
  }
  return otp;
}

// ─── GET — List Visitors ──────────────────────────────────────
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
    const skip = (page - 1) * limit;

    const isCommittee = [
      "SECRETARY",
      "TREASURER",
      "PRESIDENT",
      "ADMIN",
    ].includes(context!.role);

    const whereClause: any = {
      society_id: context!.societyId,
      ...(!isCommittee && {
        host_user_id: context!.userId,
      }),
    };

    const [visitors, total] = await Promise.all([
      prisma.visitor.findMany({
        where: whereClause,
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      prisma.visitor.count({ where: whereClause }),
    ]);

    return paginatedResponse(
      visitors,
      {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
      "Visitors retrieved successfully",
    );
  } catch (error) {
    return serverErrorResponse(error);
  }
}

// ─── POST — Create Visitor Pass ───────────────────────────────
const createVisitorSchema = z.object({
  visitor_name: z.string().min(2).max(200),
  visitor_phone: z.string().min(10).max(20),
  purpose: z.string().max(300).optional(),
  valid_hours: z.number().min(1).max(72).default(24),
});

export async function POST(request: NextRequest) {
  const { context, error } = requireAuth(request);
  if (error) return error;

  const { ipAddress, userAgent } = getRequestMeta(request);

  try {
    const body = await request.json();
    const validation = createVisitorSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        "Invalid visitor data",
        400,
        validation.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }

    const { valid_hours, ...visitorData } = validation.data;

    // Generate OTP pass
    const otpCode = generateVisitorOTP();
    const otpHash = createHash("sha256").update(otpCode).digest("hex");

    const now = new Date();
    const validUntil = new Date(now.getTime() + valid_hours * 60 * 60 * 1000);

    const visitor = await prisma.visitor.create({
      data: {
        society_id: context!.societyId,
        host_user_id: context!.userId,
        ...visitorData,
        otp_code: otpCode,
        otp_hash: otpHash,
        status: "ACTIVE",
        valid_from: now,
        valid_until: validUntil,
      },
    });

    await createAuditLog({
      societyId: context!.societyId,
      userId: context!.userId,
      action: "CREATE",
      resource: "visitors",
      resourceId: visitor.id,
      newValues: {
        visitorName: visitorData.visitor_name,
        validHours: valid_hours,
      },
      ipAddress,
      userAgent,
    });

    return createdResponse(
      {
        ...visitor,
        otp_code: otpCode, // Return OTP to show resident
      },
      "Visitor pass created successfully",
    );
  } catch (error) {
    return serverErrorResponse(error);
  }
}
