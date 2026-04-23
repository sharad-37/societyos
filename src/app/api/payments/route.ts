// src/app/api/payments/route.ts
import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-context";
import { createAuditLog, getRequestMeta } from "@/lib/audit";
import {
  createdResponse,
  errorResponse,
  paginatedResponse,
  serverErrorResponse,
} from "@/lib/api-response";
import { PAGINATION } from "@/constants/config";

// ─── GET — Payment History ────────────────────────────────────
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
    const skip = (page - 1) * limit;

    const isCommittee = [
      "SECRETARY",
      "TREASURER",
      "PRESIDENT",
      "ADMIN",
    ].includes(context!.role);

    const whereClause: any = {
      society_id: context!.societyId,
      ...(!isCommittee && { user_id: context!.userId }),
    };

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: whereClause,
        include: {
          bill: {
            select: {
              bill_number: true,
              billing_month: true,
              billing_year: true,
              flat: {
                select: {
                  flat_number: true,
                  wing: true,
                },
              },
            },
          },
          user: {
            select: { full_name: true, email: true },
          },
        },
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where: whereClause }),
    ]);

    return paginatedResponse(
      payments,
      {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
      "Payments retrieved successfully",
    );
  } catch (error) {
    return serverErrorResponse(error);
  }
}

// ─── POST — Submit Payment ────────────────────────────────────
const createPaymentSchema = z.object({
  bill_id: z.string().uuid(),
  amount: z.number().positive(),
  payment_method: z.enum(["UPI", "BANK_TRANSFER", "CASH", "CHEQUE", "ONLINE"]),
  payment_date: z.string(),
  transaction_id: z.string().optional(),
  upi_ref_number: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const { context, error } = requireAuth(request);
  if (error) return error;

  const { ipAddress, userAgent } = getRequestMeta(request);

  try {
    const body = await request.json();
    const validation = createPaymentSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        "Invalid payment data",
        400,
        validation.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }

    const data = validation.data;

    // Verify bill belongs to this society
    const bill = await prisma.bill.findFirst({
      where: {
        id: data.bill_id,
        society_id: context!.societyId,
        deleted_at: null,
      },
    });

    if (!bill) {
      return errorResponse("Bill not found", 404);
    }

    // Check bill is not already paid
    if (bill.status === "PAID") {
      return errorResponse("This bill has already been paid", 409);
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        society_id: context!.societyId,
        bill_id: data.bill_id,
        user_id: context!.userId,
        amount: data.amount,
        payment_method: data.payment_method,
        payment_status: "PENDING",
        transaction_id: data.transaction_id,
        upi_ref_number: data.upi_ref_number,
        payment_date: new Date(data.payment_date),
        notes: data.notes,
      },
      include: {
        bill: {
          select: {
            bill_number: true,
            billing_month: true,
            billing_year: true,
          },
        },
        user: {
          select: { full_name: true, email: true },
        },
      },
    });

    await createAuditLog({
      societyId: context!.societyId,
      userId: context!.userId,
      action: "CREATE",
      resource: "payments",
      resourceId: payment.id,
      newValues: {
        billId: data.bill_id,
        amount: data.amount,
        method: data.payment_method,
      },
      ipAddress,
      userAgent,
    });

    return createdResponse(
      payment,
      "Payment submitted successfully. Awaiting treasurer confirmation.",
    );
  } catch (error) {
    return serverErrorResponse(error);
  }
}
