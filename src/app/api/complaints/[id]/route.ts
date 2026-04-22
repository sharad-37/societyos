// src/app/api/complaints/[id]/route.ts
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

const updateComplaintSchema = z.object({
  status: z.enum([
    "OPEN",
    "ASSIGNED",
    "IN_PROGRESS",
    "RESOLVED",
    "CLOSED",
    "REJECTED",
  ]),
  note: z.string().optional(),
  assigned_to: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const { context, error } = requirePermission(request, "complaints:resolve");
  if (error) return error;

  const { ipAddress, userAgent } = getRequestMeta(request);

  try {
    const body = await request.json();
    const validation = updateComplaintSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse("Invalid data", 400);
    }

    const complaint = await prisma.complaint.findFirst({
      where: {
        id,
        society_id: context!.societyId,
        deleted_at: null,
      },
    });

    if (!complaint) return notFoundResponse("Complaint");

    const oldStatus = complaint.status;

    const updated = await prisma.complaint.update({
      where: { id },
      data: {
        status: validation.data.status,
        ...(validation.data.assigned_to && {
          assigned_to: validation.data.assigned_to,
        }),
        ...(validation.data.status === "RESOLVED" && {
          resolved_at: new Date(),
          resolution_notes: validation.data.note,
        }),
      },
    });

    await prisma.complaintUpdate.create({
      data: {
        complaint_id: id,
        updated_by: context!.userId,
        old_status: oldStatus as any,
        new_status: validation.data.status as any,
        note: validation.data.note,
      },
    });

    await createAuditLog({
      societyId: context!.societyId,
      userId: context!.userId,
      action: "UPDATE",
      resource: "complaints",
      resourceId: id,
      oldValues: { status: oldStatus },
      newValues: { status: validation.data.status },
      ipAddress,
      userAgent,
    });

    return successResponse(updated, "Complaint updated successfully");
  } catch (error) {
    return serverErrorResponse(error);
  }
}
