// src/lib/jwt.ts
// ============================================================
// JWT TOKEN MANAGEMENT
// Create, verify, and refresh JWT tokens
// ============================================================

import { JWT_CONFIG } from "@/constants/config";
import { JWTPayload } from "@/types";
import { SignJWT, jwtVerify } from "jose";

// Convert secret string to Uint8Array (required by jose)
const getSecret = () => {
  if (!JWT_CONFIG.secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return new TextEncoder().encode(JWT_CONFIG.secret);
};

// ─── Create Access Token (15 minutes) ───────────────────────
export async function createAccessToken(
  payload: Omit<JWTPayload, "iat" | "exp">,
): Promise<string> {
  return new SignJWT({
    email: payload.email,
    role: payload.role,
    societyId: payload.societyId,
    flatId: payload.flatId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(JWT_CONFIG.accessTokenExpiry)
    .setIssuer("societyos")
    .setAudience("societyos-app")
    .sign(getSecret());
}

// ─── Create Refresh Token (7 days) ──────────────────────────
export async function createRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(JWT_CONFIG.refreshTokenExpiry)
    .setIssuer("societyos")
    .sign(getSecret());
}

// ─── Verify Access Token ─────────────────────────────────────
export async function verifyAccessToken(
  token: string,
): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: "societyos",
      audience: "societyos-app",
    });

    return {
      sub: payload.sub as string,
      email: payload.email as string,
      role: payload.role as any,
      societyId: payload.societyId as string,
      flatId: payload.flatId as string | null,
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

// ─── Verify Refresh Token ────────────────────────────────────
export async function verifyRefreshToken(
  token: string,
): Promise<{ sub: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: "societyos",
    });
    return { sub: payload.sub as string };
  } catch {
    return null;
  }
}

// ─── Extract Token From Cookie Header ────────────────────────
export function extractTokenFromCookies(
  cookieHeader: string | null,
  cookieName: string,
): string | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").reduce(
    (acc, cookie) => {
      const [key, value] = cookie.trim().split("=");
      acc[key] = value;
      return acc;
    },
    {} as Record<string, string>,
  );

  return cookies[cookieName] || null;
}
