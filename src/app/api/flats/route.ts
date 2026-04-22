// src/app/api/flats/route.ts
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-context";
import { successResponse, serverErrorResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  const { context, error } = requireAuth(request);
  if (error) return error;

  try {
    const flats = await prisma.flat.findMany({
      where: {
        society_id: context!.societyId,
        deleted_at: null,
      },
      include: {
        users: {
          where: {
            deleted_at: null,
            status: "ACTIVE",
          },
          select: {
            id: true,
            full_name: true,
          },
        },
      },
      orderBy: [{ wing: "asc" }, { flat_number: "asc" }],
    });

    return successResponse(flats, "Flats retrieved successfully");
  } catch (error) {
    return serverErrorResponse(error);
  }
}
