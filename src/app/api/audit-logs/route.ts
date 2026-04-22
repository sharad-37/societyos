// src/app/api/audit-logs/route.ts
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-context";
import { paginatedResponse, serverErrorResponse } from "@/lib/api-response";
import { PAGINATION } from "@/constants/config";

export async function GET(request: NextRequest) {
  const { context, error } = requirePermission(request, "audit:read");
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page")) || PAGINATION.defaultPage;
    const limit = Math.min(Number(searchParams.get("limit")) || 20, 100);
    const action = searchParams.get("action");
    const skip = (page - 1) * limit;

    const whereClause: any = {
      society_id: context!.societyId,
      ...(action && action !== "ALL" && { action }),
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: whereClause,
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where: whereClause }),
    ]);

    return paginatedResponse(
      logs,
      {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
      "Audit logs retrieved",
    );
  } catch (error) {
    return serverErrorResponse(error);
  }
}
