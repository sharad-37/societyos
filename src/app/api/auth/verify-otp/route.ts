// src/app/api/auth/verify-otp/route.ts
// POST /api/auth/verify-otp
// ============================================================

import { OTP_CONFIG } from "@/constants/config";
import {
  errorResponse,
  rateLimitResponse,
  serverErrorResponse,
  successResponse,
  unauthorizedResponse,
} from "@/lib/api-response";
import { createAuditLog, getRequestMeta } from "@/lib/audit";
import { createAccessToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { authRateLimiter, otpStore } from "@/lib/redis";
import { createHash } from "crypto";
import { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

// ─── Validation Schema ───────────────────────────────────────
const verifyOTPSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  otp: z
    .string()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only numbers"),
});

// ─── Route Handler ───────────────────────────────────────────
export async function POST(request: NextRequest) {
  const { ipAddress, userAgent } = getRequestMeta(request);

  try {
    // 1. Parse and validate input
    const body = await request.json();
    const validation = verifyOTPSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        "Invalid input",
        400,
        validation.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }

    const { email, otp } = validation.data;

    // 2. Rate limit verification attempts (skip in development)
    if (process.env.NODE_ENV !== "development") {
      const limit = await authRateLimiter.limit(`verify:${email}`);
      if (!limit.success) {
        return rateLimitResponse();
      }
    }

    // 3. Get stored OTP from Redis
    const storedData = await otpStore.get(email);

    if (!storedData) {
      return errorResponse("OTP has expired. Please request a new one.", 400);
    }

    // 4. Check max attempts
    if (storedData.attempts >= OTP_CONFIG.maxAttempts) {
      await otpStore.delete(email);
      return errorResponse(
        "Too many incorrect attempts. Please request a new OTP.",
        400,
      );
    }

    // 5. Verify OTP matches
    if (storedData.otp !== otp) {
      const attempts = await otpStore.incrementAttempts(email);
      const remaining = OTP_CONFIG.maxAttempts - attempts;

      return errorResponse(
        remaining > 0
          ? `Incorrect OTP. ${remaining} attempt(s) remaining.`
          : "Too many incorrect attempts. Please request a new OTP.",
        400,
      );
    }

    // 6. OTP is valid — delete it immediately (one-time use)
    await otpStore.delete(email);

    // 7. Find user in database
    const user = await prisma.user.findFirst({
      where: {
        email,
        deleted_at: null,
        status: "ACTIVE",
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        status: true,
        society_id: true,
        flat_id: true,
        society: {
          select: { id: true, name: true, is_active: true },
        },
      },
    });

    if (!user) {
      return unauthorizedResponse(
        "No active account found for this email. Please contact your society administrator.",
      );
    }

    if (!user.society.is_active) {
      return unauthorizedResponse("Your society account has been deactivated.");
    }

    // 8. Create JWT access token
    const accessToken = await createAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role as any,
      societyId: user.society_id,
      flatId: user.flat_id,
    });

    // 9. Create refresh token
    const refreshTokenRaw = uuidv4();
    const refreshTokenHash = createHash("sha256")
      .update(refreshTokenRaw)
      .digest("hex");

    // 10. Save refresh token to database
    await prisma.refreshToken.create({
      data: {
        user_id: user.id,
        token_hash: refreshTokenHash,
        device_info: userAgent,
        ip_address: ipAddress,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // 11. Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { last_login_at: new Date() },
    });

    // 12. Audit log
    await createAuditLog({
      societyId: user.society_id,
      userId: user.id,
      action: "LOGIN",
      resource: "auth",
      ipAddress,
      userAgent,
      newValues: { email, role: user.role },
    });

    // 13. Build response with cookies
    const response = successResponse(
      {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          societyId: user.society_id,
          societyName: user.society.name,
          flatId: user.flat_id,
        },
        redirectTo: getRedirectPath(user.role as string),
      },
      "Login successful",
    );

    // 14. Set secure HttpOnly cookies
    const cookieOptions = [`HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/`];

    response.headers.set(
      "Set-Cookie",
      [
        `access_token=${accessToken}; Max-Age=${15 * 60}; ${cookieOptions.join("; ")}`,
      ].join(", "),
    );

    // Set refresh token as separate cookie
    response.headers.append(
      "Set-Cookie",
      `refresh_token=${refreshTokenRaw}; Max-Age=${7 * 24 * 60 * 60}; ${cookieOptions.join("; ")}`,
    );

    return response;
  } catch (error) {
    return serverErrorResponse(error);
  }
}

// ─── Get redirect path based on role ─────────────────────────
function getRedirectPath(role: string): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "PRESIDENT":
    case "SECRETARY":
    case "TREASURER":
      return "/committee";
    default:
      return "/resident";
  }
}
