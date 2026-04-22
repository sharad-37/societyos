// src/app/api/auth/logout/route.ts
// POST /api/auth/logout
// ============================================================

import { successResponse } from "@/lib/api-response";
import { createAuditLog, getRequestMeta } from "@/lib/audit";
import { getAuthContext } from "@/lib/auth-context";
import prisma from "@/lib/prisma";
import { createHash } from "crypto";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { ipAddress, userAgent } = getRequestMeta(request);
  const context = getAuthContext(request);

  try {
    // Get refresh token from cookie
    const refreshToken = request.cookies.get("refresh_token")?.value;

    if (refreshToken) {
      // Revoke refresh token in database
      const tokenHash = createHash("sha256").update(refreshToken).digest("hex");

      await prisma.refreshToken.updateMany({
        where: { token_hash: tokenHash },
        data: { is_revoked: true },
      });
    }

    // Audit log
    if (context) {
      await createAuditLog({
        societyId: context.societyId,
        userId: context.userId,
        action: "LOGOUT",
        resource: "auth",
        ipAddress,
        userAgent,
      });
    }

    // Clear cookies
    const response = successResponse(null, "Logged out successfully");

    response.headers.set(
      "Set-Cookie",
      [
        "access_token=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Strict",
        "refresh_token=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Strict",
      ].join(", "),
    );

    return response;
  } catch (error) {
    // Even if DB fails, clear cookies
    const response = successResponse(null, "Logged out");
    response.headers.set(
      "Set-Cookie",
      "access_token=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Strict",
    );
    return response;
  }
}
