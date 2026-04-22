// src/app/api/visitors/verify/route.ts
// Public endpoint — guards use this without login
import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { createAuditLog, getRequestMeta } from "@/lib/audit";
import {
  successResponse,
  errorResponse,
  serverErrorResponse,
} from "@/lib/api-response";

const verifySchema = z.object({
  otp_code: z.string().min(6).max(6).toUpperCase(),
  society_id: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const { ipAddress, userAgent } = getRequestMeta(request);

  try {
    const body = await request.json();
    const validation = verifySchema.safeParse(body);

    if (!validation.success) {
      return errorResponse("Invalid data", 400);
    }

    const { otp_code, society_id } = validation.data;

    // Find visitor by OTP code
    const visitor = await prisma.visitor.findFirst({
      where: {
        otp_code,
        society_id,
        status: "ACTIVE",
      },
    });

    if (!visitor) {
      return errorResponse("Invalid OTP code. Visitor not found.", 404);
    }

    const now = new Date();

    // Check if expired
    if (now > visitor.valid_until) {
      await prisma.visitor.update({
        where: { id: visitor.id },
        data: { status: "EXPIRED" },
      });
      return errorResponse("This visitor pass has expired.", 410);
    }

    // Check if already used
    if (visitor.checked_in_at && !visitor.checked_out_at) {
      // Currently inside — allow checkout
      const updated = await prisma.visitor.update({
        where: { id: visitor.id },
        data: {
          checked_out_at: now,
          status: "USED",
        },
      });

      return successResponse(
        {
          action: "CHECKOUT",
          visitor: {
            name: updated.visitor_name,
            phone: updated.visitor_phone,
            purpose: updated.purpose,
            checkedInAt: updated.checked_in_at,
            checkedOutAt: updated.checked_out_at,
          },
        },
        `✅ ${updated.visitor_name} checked OUT successfully`,
      );
    }

    if (visitor.status === "USED") {
      return errorResponse("This visitor pass has already been used.", 409);
    }

    // Check in visitor
    const updated = await prisma.visitor.update({
      where: { id: visitor.id },
      data: { checked_in_at: now },
    });

    await createAuditLog({
      societyId: society_id,
      action: "UPDATE",
      resource: "visitors",
      resourceId: visitor.id,
      newValues: { action: "CHECKIN", otp: otp_code },
      ipAddress,
      userAgent,
    });

    return successResponse(
      {
        action: "CHECKIN",
        visitor: {
          name: updated.visitor_name,
          phone: updated.visitor_phone,
          purpose: updated.purpose,
          validUntil: updated.valid_until,
          checkedInAt: updated.checked_in_at,
        },
      },
      `✅ ${updated.visitor_name} checked IN successfully`,
    );
  } catch (error) {
    return serverErrorResponse(error);
  }
}
