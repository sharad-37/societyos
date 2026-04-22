// src/app/api/polls/[id]/close/route.ts
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
  const { context, error } = requirePermission(request, "polls:close");
  if (error) return error;

  const { ipAddress, userAgent } = getRequestMeta(request);

  try {
    const poll = await prisma.poll.findFirst({
      where: {
        id,
        society_id: context!.societyId,
        deleted_at: null,
      },
    });

    if (!poll) return notFoundResponse("Poll");

    const updated = await prisma.poll.update({
      where: { id },
      data: { status: "CLOSED" },
    });

    await createAuditLog({
      societyId: context!.societyId,
      userId: context!.userId,
      action: "UPDATE",
      resource: "polls",
      resourceId: id,
      oldValues: { status: "ACTIVE" },
      newValues: { status: "CLOSED" },
      ipAddress,
      userAgent,
    });

    return successResponse(updated, "Poll closed successfully");
  } catch (error) {
    return serverErrorResponse(error);
  }
}
