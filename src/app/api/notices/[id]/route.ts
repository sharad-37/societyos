// src/app/api/notices/[id]/route.ts
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-context";
import { createAuditLog, getRequestMeta } from "@/lib/audit";
import {
  successResponse,
  notFoundResponse,
  serverErrorResponse,
} from "@/lib/api-response";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { context, error } = requirePermission(request, "notices:delete");
  if (error) return error;

  const { ipAddress, userAgent } = getRequestMeta(request);

  try {
    const notice = await prisma.notice.findFirst({
      where: {
        id,
        society_id: context!.societyId,
        deleted_at: null,
      },
    });

    if (!notice) return notFoundResponse("Notice");

    // Soft delete
    await prisma.notice.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    await createAuditLog({
      societyId: context!.societyId,
      userId: context!.userId,
      action: "DELETE",
      resource: "notices",
      resourceId: id,
      oldValues: { title: notice.title },
      ipAddress,
      userAgent,
    });

    return successResponse(null, "Notice deleted successfully");
  } catch (error) {
    return serverErrorResponse(error);
  }
}
