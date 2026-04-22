// src/app/api/expenses/[id]/approve/route.ts
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-context";
import { createAuditLog, getRequestMeta } from "@/lib/audit";
import {
  successResponse,
  notFoundResponse,
  serverErrorResponse,
} from "@/lib/api-response";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const { context, error } = requirePermission(request, "expenses:approve");
  if (error) return error;

  const { ipAddress, userAgent } = getRequestMeta(request);

  try {
    const expense = await prisma.expense.findFirst({
      where: {
        id,
        society_id: context!.societyId,
        deleted_at: null,
      },
    });

    if (!expense) return notFoundResponse("Expense");

    const updated = await prisma.expense.update({
      where: { id },
      data: {
        status: "APPROVED",
        approved_by: context!.userId,
        approved_at: new Date(),
      },
    });

    await createAuditLog({
      societyId: context!.societyId,
      userId: context!.userId,
      action: "APPROVE",
      resource: "expenses",
      resourceId: id,
      ipAddress,
      userAgent,
    });

    return successResponse(updated, "Expense approved successfully");
  } catch (error) {
    return serverErrorResponse(error);
  }
}
