// src/constants/config.ts
// ============================================================
// APP-WIDE CONSTANTS
// Single source of truth for all configuration values
// ============================================================

export const APP_CONFIG = {
  name: "SocietyOS",
  version: "1.0.0",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
} as const;

export const JWT_CONFIG = {
  secret: process.env.JWT_SECRET!,
  accessTokenExpiry: "15m",
  refreshTokenExpiry: "7d",
  algorithm: "HS256" as const,
} as const;

export const OTP_CONFIG = {
  length: 6,
  expiryMinutes: 10,
  maxAttempts: 3,
  lockoutMinutes: 30,
  resendCooldownSeconds: 60,
} as const;

export const RATE_LIMIT_CONFIG = {
  // General API: 100 requests per minute
  api: { requests: 100, window: "1 m" },
  // Auth endpoints: 10 requests per hour
  auth: { requests: 10, window: "1 h" },
  // OTP sending: 3 requests per hour per email
  otp: { requests: 3, window: "1 h" },
} as const;

export const PAGINATION = {
  defaultPage: 1,
  defaultLimit: 20,
  maxLimit: 100,
} as const;

export const BILL_CONFIG = {
  dueDayOfMonth: 10, // Bills due on 10th of each month
  lateFeePercentage: 2, // 2% late fee
  lateFeeGraceDays: 5, // 5 days grace after due date
} as const;

export const COMPLAINT_SLA = {
  // Hours to resolve by priority
  URGENT: 24,
  HIGH: 72,
  MEDIUM: 168, // 7 days
  LOW: 336, // 14 days
} as const;
