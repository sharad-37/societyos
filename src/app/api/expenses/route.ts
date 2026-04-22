// src/app/api/expenses/route.ts
import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAuth, requirePermission } from "@/lib/auth-context";
import { createAuditLog, getRequestMeta } from "@/lib/audit";
import {
  paginatedResponse,
  createdResponse,
  errorResponse,
  serverErrorResponse,
} from "@/lib/api-response";
import { PAGINATION } from "@/constants/config";

// ─── GET ─────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { context, error } = requireAuth(request);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page")) || PAGINATION.defaultPage;
    const limit = Math.min(
      Number(searchParams.get("limit")) || PAGINATION.defaultLimit,
      PAGINATION.maxLimit,
    );
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const skip = (page - 1) * limit;

    const whereClause: any = {
      society_id: context!.societyId,
      deleted_at: null,
      ...(status && { status }),
      ...(category && { category }),
    };

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where: whereClause,
        include: {
          added_by_user: {
            select: { full_name: true },
          },
        },
        orderBy: { expense_date: "desc" },
        skip,
        take: limit,
      }),
      prisma.expense.count({ where: whereClause }),
    ]);

    return paginatedResponse(
      expenses,
      {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
      "Expenses retrieved successfully",
    );
  } catch (error) {
    return serverErrorResponse(error);
  }
}

// ─── POST ────────────────────────────────────────────────────
const createExpenseSchema = z.object({
  category: z.enum([
    "MAINTENANCE",
    "SECURITY",
    "CLEANING",
    "ELECTRICITY",
    "WATER",
    "LIFT",
    "GARDEN",
    "INSURANCE",
    "LEGAL",
    "ADMINISTRATIVE",
    "EMERGENCY",
    "OTHER",
  ]),
  title: z.string().min(3).max(300),
  description: z.string().optional(),
  amount: z.number().positive(),
  expense_date: z.string(),
  vendor_name: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const { context, error } = requirePermission(request, "expenses:create");
  if (error) return error;

  const { ipAddress, userAgent } = getRequestMeta(request);

  try {
    const body = await request.json();
    const validation = createExpenseSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        "Invalid expense data",
        400,
        validation.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }

    const expense = await prisma.expense.create({
      data: {
        society_id: context!.societyId,
        added_by: context!.userId,
        ...validation.data,
        expense_date: new Date(validation.data.expense_date),
        status: "PENDING_APPROVAL",
      },
    });

    await createAuditLog({
      societyId: context!.societyId,
      userId: context!.userId,
      action: "CREATE",
      resource: "expenses",
      resourceId: expense.id,
      newValues: validation.data,
      ipAddress,
      userAgent,
    });

    return createdResponse(expense, "Expense added successfully");
  } catch (error) {
    return serverErrorResponse(error);
  }
}
