// src/lib/api-response.ts
// ============================================================
// STANDARDIZED API RESPONSE HELPERS
// Every API route uses these functions
// ============================================================

import { ApiResponse, PaginationMeta } from "@/types";
import { NextResponse } from "next/server";

// ─── Success Responses ──────────────────────────────────────

export function successResponse<T>(
  data: T,
  message: string = "Success",
  status: number = 200,
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, message, data }, { status });
}

export function createdResponse<T>(
  data: T,
  message: string = "Created successfully",
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, message, data }, { status: 201 });
}

export function paginatedResponse<T>(
  data: T[],
  pagination: PaginationMeta,
  message: string = "Success",
): NextResponse<ApiResponse<T[]>> {
  return NextResponse.json(
    { success: true, message, data, pagination },
    { status: 200 },
  );
}

// ─── Error Responses ────────────────────────────────────────

export function errorResponse(
  message: string,
  status: number = 400,
  errors?: Record<string, string[]>,
): NextResponse<ApiResponse> {
  return NextResponse.json(
    { success: false, message, ...(errors && { errors }) },
    { status },
  );
}

export function unauthorizedResponse(
  message: string = "Authentication required",
): NextResponse<ApiResponse> {
  return NextResponse.json({ success: false, message }, { status: 401 });
}

export function forbiddenResponse(
  message: string = "You do not have permission to perform this action",
): NextResponse<ApiResponse> {
  return NextResponse.json({ success: false, message }, { status: 403 });
}

export function notFoundResponse(
  resource: string = "Resource",
): NextResponse<ApiResponse> {
  return NextResponse.json(
    { success: false, message: `${resource} not found` },
    { status: 404 },
  );
}

export function rateLimitResponse(): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      message: "Too many requests. Please try again later.",
    },
    {
      status: 429,
      headers: { "Retry-After": "60" },
    },
  );
}

export function serverErrorResponse(
  error?: unknown,
): NextResponse<ApiResponse> {
  // Log error in development
  if (process.env.NODE_ENV === "development" && error) {
    console.error("Server Error:", error);
  }
  return NextResponse.json(
    { success: false, message: "Internal server error" },
    { status: 500 },
  );
}
