// src/types/index.ts
// ============================================================
// GLOBAL TYPE DEFINITIONS
// Used across frontend and backend
// ============================================================

import { UserRole } from "@/constants/roles";

// ─── JWT Token Payload ──────────────────────────────────────
export interface JWTPayload {
  sub: string; // user ID
  email: string;
  role: UserRole;
  societyId: string;
  flatId: string | null;
  iat?: number;
  exp?: number;
}

// ─── API Response Wrapper ───────────────────────────────────
export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
  pagination?: PaginationMeta;
}

// ─── Pagination ─────────────────────────────────────────────
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

// ─── Auth Context (attached to every request) ───────────────
export interface AuthContext {
  userId: string;
  email: string;
  role: UserRole;
  societyId: string;
  flatId: string | null;
}

// ─── OTP Store (Redis) ──────────────────────────────────────
export interface OTPStore {
  otp: string;
  email: string;
  attempts: number;
  createdAt: number;
}
