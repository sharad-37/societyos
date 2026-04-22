// src/lib/auth-context.ts
// ============================================================
// EXTRACT AUTH CONTEXT FROM REQUEST
// Used in every API route to get current user info
// ============================================================

import { hasPermission, Permission, UserRole } from "@/constants/roles";
import { forbiddenResponse, unauthorizedResponse } from "@/lib/api-response";
import { AuthContext } from "@/types";
import { NextRequest, NextResponse } from "next/server";

// Get auth context from request headers (set by middleware)
export function getAuthContext(request: NextRequest): AuthContext | null {
  const userId = request.headers.get("x-user-id");
  const email = request.headers.get("x-user-email");
  const role = request.headers.get("x-user-role") as UserRole;
  const societyId = request.headers.get("x-society-id");
  const flatId = request.headers.get("x-flat-id") || null;

  if (!userId || !email || !role || !societyId) {
    return null;
  }

  return { userId, email, role, societyId, flatId };
}

// Require auth — returns context or error response
export function requireAuth(
  request: NextRequest,
):
  | { context: AuthContext; error: null }
  | { context: null; error: NextResponse } {
  const context = getAuthContext(request);

  if (!context) {
    return {
      context: null,
      error: unauthorizedResponse(),
    };
  }

  return { context, error: null };
}

// Require specific permission
export function requirePermission(
  request: NextRequest,
  permission: Permission,
):
  | { context: AuthContext; error: null }
  | { context: null; error: NextResponse } {
  const { context, error } = requireAuth(request);

  if (error || !context) {
    return { context: null, error: error! };
  }

  if (!hasPermission(context.role, permission)) {
    return {
      context: null,
      error: forbiddenResponse(
        `Your role (${context.role}) cannot perform this action`,
      ),
    };
  }

  return { context, error: null };
}
