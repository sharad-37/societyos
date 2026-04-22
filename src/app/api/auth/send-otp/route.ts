// src/app/api/auth/send-otp/route.ts
// POST /api/auth/send-otp
// ============================================================
import {
  errorResponse,
  rateLimitResponse,
  serverErrorResponse,
  successResponse,
} from "@/lib/api-response";
import { createAuditLog, getRequestMeta } from "@/lib/audit";
import prisma from "@/lib/prisma";
import { otpRateLimiter, otpStore } from "@/lib/redis";
import { sendOTPEmail } from "@/lib/resend";
import { NextRequest } from "next/server";
import { z } from "zod";

// ─── Validation Schema ───────────────────────────────────────
const sendOTPSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .toLowerCase()
    .trim(),
});

// ─── Generate 6-digit OTP ────────────────────────────────────
function generateOTP(length: number = 6): string {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}

// ─── Route Handler ───────────────────────────────────────────
export async function POST(request: NextRequest) {
  const { ipAddress, userAgent } = getRequestMeta(request);

  try {
    // 1. Parse request body
    const body = await request.json();

    // 2. Validate input
    const validation = sendOTPSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(
        "Invalid email address",
        400,
        validation.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }

    const { email } = validation.data;

    // REPLACE WITH this more relaxed version:
    // Rate limit check
    const ipLimit = await otpRateLimiter.limit(ipAddress);
    if (!ipLimit.success) {
      // Allow in development always
      if (process.env.NODE_ENV !== "development") {
        return rateLimitResponse();
      }
    }

    const emailLimit = await otpRateLimiter.limit(`email:${email}`);
    if (!emailLimit.success) {
      if (process.env.NODE_ENV !== "development") {
        return errorResponse(
          "Too many OTP requests. Please wait before trying again.",
          429,
        );
      }
    }

    // 5. Check if user exists in any society
    const user = await prisma.user.findFirst({
      where: {
        email,
        deleted_at: null,
        status: { in: ["ACTIVE", "PENDING_VERIFICATION"] },
      },
      select: {
        id: true,
        full_name: true,
        status: true,
        society: { select: { name: true } },
      },
    });

    // 6. Generate OTP (regardless of user existence — prevents enumeration)
    const otp = generateOTP(6);

    // 7. Store OTP in Redis (expires in 10 minutes)
    await otpStore.set(email, otp);

    // REPLACE WITH:
    const emailSent = await sendOTPEmail(
      email,
      otp,
      user?.full_name || undefined,
    );

    // Development: show OTP even if email fails
    if (!emailSent) {
      console.error("❌ Email send failed for:", email);

      // In development — return OTP anyway so you can test
      if (process.env.NODE_ENV === "development") {
        console.log("🔑 DEV MODE OTP:", otp, "for email:", email);
        return successResponse(
          {
            email,
            expiresInMinutes: 10,
            otp, // Show OTP in response for dev testing
            warning: "Email failed but OTP shown for development",
          },
          "OTP generated (email failed — check console for OTP)",
        );
      }

      return errorResponse("Failed to send OTP email. Please try again.", 500);
    }

    // 9. Audit log
    await createAuditLog({
      userId: user?.id,
      action: "CREATE",
      resource: "otp",
      ipAddress,
      userAgent,
      newValues: { email, userExists: !!user },
    });

    // 10. Return success (same message whether user exists or not)
    return successResponse(
      {
        email,
        expiresInMinutes: 10,
        // Only in development — remove in production
        ...(process.env.NODE_ENV === "development" && { otp }),
      },
      "OTP sent successfully. Please check your email.",
    );
  } catch (error) {
    return serverErrorResponse(error);
  }
}
