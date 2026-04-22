// src/app/api/billing/[id]/route.ts
import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-context";
import { createAuditLog, getRequestMeta } from "@/lib/audit";
import {
  successResponse,
  notFoundResponse,
  errorResponse,
  serverErrorResponse,
} from "@/lib/api-response";

const updateBillSchema = z.object({
  status: z.enum(["PENDING", "PAID", "OVERDUE", "PARTIALLY_PAID", "WAIVED"]),
  amount_paid: z.number().optional(),
  notes: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const { context, error } = requirePermission(request, "bills:update");
  if (error) return error;

  const { ipAddress, userAgent } = getRequestMeta(request);

  try {
    const body = await request.json();
    const validation = updateBillSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse("Invalid data", 400);
    }

    const bill = await prisma.bill.findFirst({
      where: {
        id,
        society_id: context!.societyId,
        deleted_at: null,
      },
    });

    if (!bill) return notFoundResponse("Bill");

    const updated = await prisma.bill.update({
      where: { id },
      data: {
        status: validation.data.status,
        ...(validation.data.status === "PAID" && {
          paid_at: new Date(),
          amount_paid: bill.total_amount,
        }),
        ...(validation.data.amount_paid && {
          amount_paid: validation.data.amount_paid,
        }),
        ...(validation.data.notes && {
          notes: validation.data.notes,
        }),
      },
    });

    await createAuditLog({
      societyId: context!.societyId,
      userId: context!.userId,
      action: "UPDATE",
      resource: "bills",
      resourceId: id,
      oldValues: { status: bill.status },
      newValues: { status: validation.data.status },
      ipAddress,
      userAgent,
    });

    return successResponse(updated, "Bill updated successfully");
  } catch (error) {
    return serverErrorResponse(error);
  }
}
