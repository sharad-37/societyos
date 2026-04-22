// src/middleware.ts
// Add this comment at top to acknowledge:
// Next.js 16 - middleware.ts is still valid

import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/jwt";

// Routes that do NOT need authentication
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/verify-otp",
  "/api/auth/send-otp",
  "/api/auth/verify-otp",
];

const PUBLIC_PREFIXES = ["/_next", "/favicon", "/images"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );
  const isPublicPrefix = PUBLIC_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (isPublicRoute || isPublicPrefix) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get("access_token")?.value;

  if (!accessToken) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required",
        },
        { status: 401 },
      );
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const payload = await verifyAccessToken(accessToken);

  if (!payload) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          success: false,
          message: "Token expired. Please login again.",
        },
        { status: 401 },
      );
    }
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("access_token");
    return response;
  }

  // Attach user info to headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", payload.sub);
  requestHeaders.set("x-user-email", payload.email);
  requestHeaders.set("x-user-role", payload.role);
  requestHeaders.set("x-society-id", payload.societyId);
  requestHeaders.set("x-flat-id", payload.flatId || "");

  // Role-based page access
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

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
