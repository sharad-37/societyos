// src/app/api/members/[id]/route.ts
import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-context";
import { createAuditLog, getRequestMeta } from "@/lib/audit";
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  serverErrorResponse,
} from "@/lib/api-response";

const updateMemberSchema = z.object({
  full_name: z.string().min(2).max(200).optional(),
  phone: z.string().min(10).max(20).optional(),
  role: z.enum(["RESIDENT", "SECRETARY", "TREASURER", "PRESIDENT"]).optional(),
  flat_id: z.string().uuid().nullable().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
  is_owner: z.boolean().optional(),
  move_out_date: z.string().optional(),
});

// ─── PATCH — Update Member ────────────────────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { context, error } = requirePermission(request, "members:manage");
  if (error) return error;

  const { ipAddress, userAgent } = getRequestMeta(request);

  try {
    const body = await request.json();
    const validation = updateMemberSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse("Invalid data", 400);
    }

    // Find member in same society
    const member = await prisma.user.findFirst({
      where: {
        id,
        society_id: context!.societyId,
        deleted_at: null,
      },
    });

    if (!member) return notFoundResponse("Member");

    const oldData = {
      role: member.role,
      status: member.status,
      flat_id: member.flat_id,
    };

    // Update member
    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...validation.data,
        ...(validation.data.move_out_date && {
          move_out_date: new Date(validation.data.move_out_date),
        }),
        updated_at: new Date(),
      },
      include: {
        flat: {
          select: {
            flat_number: true,
            wing: true,
          },
        },
      },
    });

    await createAuditLog({
      societyId: context!.societyId,
      userId: context!.userId,
      action: "UPDATE",
      resource: "users",
      resourceId: id,
      oldValues: oldData,
      newValues: validation.data,
      ipAddress,
      userAgent,
    });

    return successResponse(updated, "Member updated successfully");
  } catch (error) {
    return serverErrorResponse(error);
  }
}

// ─── DELETE — Soft Delete Member ──────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { context, error } = requirePermission(request, "members:manage");
  if (error) return error;

  const { ipAddress, userAgent } = getRequestMeta(request);

  try {
    const member = await prisma.user.findFirst({
      where: {
        id,
        society_id: context!.societyId,
        deleted_at: null,
      },
    });

    if (!member) return notFoundResponse("Member");

    // Prevent deleting yourself
    if (id === context!.userId) {
      return errorResponse("You cannot remove yourself", 400);
    }

    // Soft delete
    await prisma.user.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        status: "INACTIVE",
      },
    });

    await createAuditLog({
      societyId: context!.societyId,
      userId: context!.userId,
      action: "DELETE",
      resource: "users",
      resourceId: id,
      oldValues: { email: member.email, role: member.role },
      ipAddress,
      userAgent,
    });

    return successResponse(null, "Member removed successfully");
  } catch (error) {
    return serverErrorResponse(error);
  }
}
