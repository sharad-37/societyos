// src/middleware.ts
// ============================================================
// NEXT.JS MIDDLEWARE
// Runs before EVERY request
// Protects routes — verifies JWT tokens
// ============================================================

import { verifyAccessToken } from "@/lib/jwt";
import { NextRequest, NextResponse } from "next/server";

// Routes that do NOT need authentication
const PUBLIC_ROUTES = [
  "/", // Landing page
  "/login", // Login page
  "/verify-otp", // OTP verification
  "/api/auth/send-otp", // Send OTP API
  "/api/auth/verify-otp", // Verify OTP API
];

// Routes that start with these prefixes are public
const PUBLIC_PREFIXES = [
  "/_next", // Next.js internals
  "/favicon", // Favicon
  "/images", // Public images
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Check if route is public ────────────────────────────
  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );
  const isPublicPrefix = PUBLIC_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (isPublicRoute || isPublicPrefix) {
    return NextResponse.next();
  }

  // ── Get access token from cookie ────────────────────────
  const accessToken = request.cookies.get("access_token")?.value;

  if (!accessToken) {
    // API routes return 401 JSON
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 },
      );
    }
    // Page routes redirect to login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ── Verify JWT token ─────────────────────────────────────
  const payload = await verifyAccessToken(accessToken);

  if (!payload) {
    // Token is invalid or expired
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, message: "Token expired. Please login again." },
        { status: 401 },
      );
    }
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("access_token");
    return response;
  }

  // ── Attach user info to request headers ──────────────────
  // API routes can read these headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", payload.sub);
  requestHeaders.set("x-user-email", payload.email);
  requestHeaders.set("x-user-role", payload.role);
  requestHeaders.set("x-society-id", payload.societyId);
  requestHeaders.set("x-flat-id", payload.flatId || "");

  // ── Role-based page access ───────────────────────────────
  if (pathname.startsWith("/committee") || pathname.startsWith("/admin")) {
    const committeeRoles = ["SECRETARY", "TREASURER", "PRESIDENT", "ADMIN"];
    if (!committeeRoles.includes(payload.role)) {
      return NextResponse.redirect(new URL("/resident", request.url));
    }
  }

  if (pathname.startsWith("/admin")) {
    if (payload.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/committee", request.url));
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

// Which routes middleware runs on
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
