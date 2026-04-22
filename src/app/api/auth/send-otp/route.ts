// src/app/api/auth/send-otp/route.ts
// POST /api/auth/send-otp

import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { otpStore, otpRateLimiter } from "@/lib/redis";
import { sendOTPEmail } from "@/lib/resend";
import { createAuditLog, getRequestMeta } from "@/lib/audit";
import {
  successResponse,
  errorResponse,
  rateLimitResponse,
  serverErrorResponse,
} from "@/lib/api-response";

// ─── Validation Schema ────────────────────────────────────────
const sendOTPSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .toLowerCase()
    .trim(),
});

// ─── Generate 6-digit OTP ─────────────────────────────────────
function generateOTP(length: number = 6): string {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}

// ─── Route Handler ────────────────────────────────────────────
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

    // 3. Rate limit check
    const isDev = process.env.NODE_ENV === "development";

    if (!isDev) {
      const ipLimit = await otpRateLimiter.limit(ipAddress);
      if (!ipLimit.success) {
        return rateLimitResponse();
      }

      const emailLimit = await otpRateLimiter.limit(`email:${email}`);
      if (!emailLimit.success) {
        return errorResponse(
          "Too many OTP requests. Please wait before trying again.",
          429,
        );
      }
    }

    // 4. Check if user exists
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

    // 5. Generate OTP
    const otp = generateOTP(6);

    // 6. Store OTP in Redis
    await otpStore.set(email, otp);

    // 7. Try to send email
    const emailSent = await sendOTPEmail(
      email,
      otp,
      user?.full_name || undefined,
    );

    // 8. Audit log
    await createAuditLog({
      userId: user?.id,
      action: "CREATE",
      resource: "otp",
      ipAddress,
      userAgent,
      newValues: { email, userExists: !!user },
    });

    // 9. Return response
    // Always include OTP as fallback
    // This ensures login works even if email fails
    if (!emailSent) {
      console.error("❌ Email send failed for:", email);
      console.log("🔑 Fallback OTP:", otp);

      return successResponse(
        {
          email,
          expiresInMinutes: 10,
          otp,
          warning: "Email delivery failed. Use the OTP code shown here.",
        },
        "OTP generated. Email failed — use the code shown.",
      );
    }

    // Email sent successfully
    return successResponse(
      {
        email,
        expiresInMinutes: 10,
        // Show OTP in development only
        ...(isDev && { otp }),
      },
      "OTP sent successfully. Please check your email.",
    );
  } catch (error) {
    return serverErrorResponse(error);
  }
}
