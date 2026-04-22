// src/lib/audit.ts
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

type AuditAction =
  | "CREATE"
  | "READ"
  | "UPDATE"
  | "DELETE"
  | "LOGIN"
  | "LOGOUT"
  | "EXPORT"
  | "APPROVE"
  | "REJECT";

interface AuditLogData {
  societyId?: string;
  userId?: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  status?: "SUCCESS" | "FAILED";
  errorMessage?: string;
}

export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        society_id: data.societyId ?? null,
        user_id: data.userId ?? null,
        action: data.action,
        resource: data.resource,
        resource_id: data.resourceId ?? null,
        // ← Prisma.JsonNull for nullable JSON columns
        old_values: data.oldValues
          ? (data.oldValues as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        new_values: data.newValues
          ? (data.newValues as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        ip_address: data.ipAddress ?? null,
        user_agent: data.userAgent ?? null,
        status: data.status ?? "SUCCESS",
        error_message: data.errorMessage ?? null,
      },
    });
  } catch (error) {
    console.error("Audit log failed:", error);
  }
}

export function getRequestMeta(request: Request): {
  ipAddress: string;
  userAgent: string;
} {
  const forwarded = request.headers.get("x-forwarded-for");
  const ipAddress = forwarded
    ? forwarded.split(",")[0].trim()
    : (request.headers.get("x-real-ip") ?? "unknown");

  const userAgent = request.headers.get("user-agent") ?? "unknown";

  return { ipAddress, userAgent };
}
