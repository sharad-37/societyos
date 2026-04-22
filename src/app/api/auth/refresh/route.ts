// src/app/api/auth/refresh/route.ts
// POST /api/auth/refresh
// ============================================================

import { NextRequest } from "next/server";
import { createHash } from "crypto";
import prisma from "@/lib/prisma";
import { createAccessToken } from "@/lib/jwt";
import {
  successResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get("refresh_token")?.value;

    if (!refreshToken) {
      return unauthorizedResponse("No refresh token provided");
    }

    // Hash and look up refresh token
    const tokenHash = createHash("sha256").update(refreshToken).digest("hex");

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token_hash: tokenHash },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            society_id: true,
            flat_id: true,
            status: true,
            deleted_at: true,
          },
        },
      },
    });

    // Validate stored token
    if (
      !storedToken ||
      storedToken.is_revoked ||
      storedToken.expires_at < new Date() ||
      !storedToken.user ||
      storedToken.user.status !== "ACTIVE" ||
      storedToken.user.deleted_at
    ) {
      return unauthorizedResponse("Invalid or expired refresh token");
    }

    // Create new access token
    const newAccessToken = await createAccessToken({
      sub: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role as any,
      societyId: storedToken.user.society_id,
      flatId: storedToken.user.flat_id,
    });

    const response = successResponse(
      { accessToken: newAccessToken },
      "Token refreshed",
    );

    // Set new access token cookie
    response.headers.set(
      "Set-Cookie",
      `access_token=${newAccessToken}; Max-Age=${15 * 60}; Path=/; HttpOnly; Secure; SameSite=Strict`,
    );

    return response;
  } catch (error) {
    return serverErrorResponse(error);
  }
}
